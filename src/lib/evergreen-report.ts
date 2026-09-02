import { createClient } from "@supabase/supabase-js";

interface Row {
  webinar_date: string;
  registrants: number;
  attendees: number;
  seg_no_show: number;
  seg_before_pitch: number;
  seg_reached_pitch: number;
  seg_full_pitch: number;
  conversions: number;
  recording_label: string | null;
}

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// webinar started? (20:00 Europe/Belgrade = 18:00 UTC) — before that, attendance is N/A
const occurred = (d: string) => Date.now() >= new Date(d + "T18:00:00Z").getTime();
const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);
const f1 = (n: number) => n.toFixed(1);
const MIN_SAMPLE = 20; // min attendees for a day to count in best/worst (kills tiny-sample outliers)

// Builds the full, guard-railed evergreen performance report that the MCP tool
// returns. Pre-computes weighted aggregates and trends so the model reads exact
// numbers instead of doing arithmetic over the raw table, and excludes
// tiny-sample days from best/worst so "100% from 3 people" can't win.
export async function buildEvergreenReport(): Promise<string> {
  const sb = svc();
  const { data: org } = await sb.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return "Nema podataka (org 'tibor' nije nađen).";

  const { data } = await sb
    .from("evergreen_webinars")
    .select("webinar_date, registrants, attendees, seg_no_show, seg_before_pitch, seg_reached_pitch, seg_full_pitch, conversions, recording_label")
    .eq("org_id", org.id)
    .order("webinar_date");
  const rows = (data || []) as Row[];
  const done = rows.filter((r) => occurred(r.webinar_date));
  const upcoming = rows.filter((r) => !occurred(r.webinar_date));
  if (!done.length) return "Još nema održanih evergreen webinara u bazi.";

  // Sales come from Stripe (source of truth) via evergreen_sales; the per-day
  // `conversions` above are the attributed subset. Pull grand totals so the
  // report reconciles exactly with Stripe (attributed + unattributed).
  const { count: salesTotal } = await sb
    .from("evergreen_sales")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("refunded", false);
  const { count: salesUnattributed } = await sb
    .from("evergreen_sales")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("refunded", false)
    .is("webinar_date", null);

  const sum = (a: Row[], f: (r: Row) => number) => a.reduce((s, r) => s + f(r), 0);
  const reg = sum(done, (r) => r.registrants);
  const att = sum(done, (r) => r.attendees);
  const conv = sum(done, (r) => r.conversions);
  const full = sum(done, (r) => r.seg_full_pitch);
  const reached = sum(done, (r) => r.seg_reached_pitch + r.seg_full_pitch);

  const withR = done.map((r) => ({ ...r, show: pct(r.attendees, r.registrants), cr: pct(r.conversions, r.attendees) }));
  const sample = withR.filter((r) => r.attendees >= MIN_SAMPLE);
  const maxBy = <T>(a: T[], k: (x: T) => number) => (a.length ? a.reduce((x, y) => (k(y) > k(x) ? y : x)) : null);
  const minBy = <T>(a: T[], k: (x: T) => number) => (a.length ? a.reduce((x, y) => (k(y) < k(x) ? y : x)) : null);
  const bestShow = maxBy(sample, (r) => r.show);
  const worstShow = minBy(sample, (r) => r.show);
  const bestConv = maxBy(sample, (r) => r.cr);
  const worstConv = minBy(sample, (r) => r.cr);

  const win = (a: Row[]) => {
    const r = sum(a, (x) => x.registrants), t = sum(a, (x) => x.attendees), c = sum(a, (x) => x.conversions);
    return { reg: r, att: t, conv: c, show: pct(t, r), cr: pct(c, t) };
  };
  const l7 = win(done.slice(-7)), p7 = win(done.slice(-14, -7));
  const l30 = win(done.slice(-30)), p30 = win(done.slice(-60, -30));
  const arrow = (a: number, b: number) => (a > b ? "raste ↑" : a < b ? "pada ↓" : "isto →");

  const daily = withR
    .slice(-90)
    .map((r) => `${r.webinar_date} | prijave ${r.registrants} | došli ${r.attendees} | show ${f1(r.show)}% | <pitch ${r.seg_before_pitch} | pitch ${r.seg_reached_pitch} | full ${r.seg_full_pitch} | kupili ${r.conversions} | conv ${f1(r.cr)}%`)
    .join("\n");

  return [
    "# Evergreen webinar — performanse (Tibor / Editunovac)",
    "Izvor: prijave/dolasci iz GHL tagova (~10 min svežina); PRODAJE iz Stripe-a (source of truth, evergreen_sales) atribuirane na dan webinara. Evergreen webinar je dnevni, u 20:00 (Europe/Belgrade). VAŽNO: sve rate-ove računaj TEŽINSKI (Σ brojnik / Σ imenilac za period), NE kao prosek dnevnih procenata. Za \"najbolji/najslabiji dan\" koristi samo dane sa dovoljno uzorka (≥" + MIN_SAMPLE + " došlih).",
    "",
    `## Ukupno (${done.length} održanih: ${done[0].webinar_date} → ${done[done.length - 1].webinar_date})`,
    `- Prijave: ${reg}`,
    `- Došli: ${att} — show-rate ${f1(pct(att, reg))}%`,
    `- Dočekali pitch (reached+full): ${reached} — ${f1(pct(reached, att))}% od došlih`,
    `- Full pitch: ${full} — ${f1(pct(full, att))}% od došlih`,
    `- Kupili: ${conv} — ${f1(pct(conv, att))}% od došlih (conv-rate), ${f1(pct(conv, reg))}% od prijava`,
    `- Ukupno prodaja (Stripe, sve dane): ${salesTotal ?? conv}${salesUnattributed ? ` — od toga ${salesUnattributed} nije vezano za konkretan dan` : ""}`,
    "",
    "## Trendovi (težinski)",
    `- Zadnjih 7 dana: show ${f1(l7.show)}%, conv ${f1(l7.cr)}% (${l7.conv} kupili / ${l7.att} došli). Prethodnih 7: show ${f1(p7.show)}%, conv ${f1(p7.cr)}%. → conv ${arrow(l7.cr, p7.cr)}, show ${arrow(l7.show, p7.show)}.`,
    `- Zadnjih 30 dana: show ${f1(l30.show)}%, conv ${f1(l30.cr)}% (${l30.conv}/${l30.att}). Prethodnih 30: show ${f1(p30.show)}%, conv ${f1(p30.cr)}%. → conv ${arrow(l30.cr, p30.cr)}.`,
    "",
    `## Najbolji / najslabiji dani (samo ≥${MIN_SAMPLE} došlih)`,
    bestShow ? `- Najbolji show-rate: ${bestShow.webinar_date} — ${f1(bestShow.show)}% (${bestShow.attendees}/${bestShow.registrants})` : "",
    worstShow ? `- Najslabiji show-rate: ${worstShow.webinar_date} — ${f1(worstShow.show)}% (${worstShow.attendees}/${worstShow.registrants})` : "",
    bestConv ? `- Najbolja konverzija: ${bestConv.webinar_date} — ${f1(bestConv.cr)}% (${bestConv.conversions} kupili / ${bestConv.attendees} došli)` : "",
    worstConv ? `- Najslabija konverzija: ${worstConv.webinar_date} — ${f1(worstConv.cr)}% (${worstConv.conversions}/${worstConv.attendees})` : "",
    upcoming.length ? `\n## Predstoji (webinar još nije bio — attendance N/A)\n${upcoming.map((u) => `- ${u.webinar_date}: ${u.registrants} prijava`).join("\n")}` : "",
    "",
    `## Dnevni podaci (poslednjih ${Math.min(90, withR.length)} dana)`,
    daily,
    "",
    "Napomene: show-rate = došli/prijave; conv-rate = kupili/došli. \"Kupili\" = stvarna Stripe plaćanja (početna Editunovac pretplata, bez obnova), atribuirana na dan webinara (last-touch preko optin taga, pa vreme kupovine). Segmenti su watch-depth: no-show → <pitch (otišli pre pitcha) → pitch (dočekali pitch) → full (full pitch). Ako pitanje traži nešto van ovih agregata (npr. imena/emailove pojedinaca, izvor saobraćaja), reci da to nije dostupno u ovom izvoru.",
  ]
    .filter((x) => x !== "")
    .join("\n");
}
