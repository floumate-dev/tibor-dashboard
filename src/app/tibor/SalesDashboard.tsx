"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker, { presetLabel, Range } from "./DateRangePicker";
import { CallRow, EvergreenDay, PACKAGES, PACKAGE_FALLBACK_COLOR, Stage } from "./data";

type Account = { slug: string; pin: string; name: string; vocative: string; photo: string };

// Nalozi. Svaki ima svoj personalizovani login URL (/tibor?u=<slug>) koji prikaže
// njegov PFP + "Ćao, <ime>" i prima SAMO njegov PIN. Generalni login (/tibor, bez
// ?u) nema PFP i prima bilo koji PIN.
const ACCOUNTS: Account[] = [
  { slug: "tibor", pin: "1212", name: "Tibor", vocative: "Tibore", photo: "/tibor.png" },
  { slug: "matej", pin: "3344", name: "Matej", vocative: "Matej", photo: "/matej.png" },
];

type WebinarData = {
  webinar: string;
  webinarLabel: string;
  optin: number;
  application: number;
  sources: { key: string; label: string; count: number }[];
  availableWebinars: { slug: string; label: string }[];
};

const MONTHS_SHORT = ["sij","velj","ožu","tra","svi","lip","srp","kol","ruj","lis","stu","pro"];
const PAGE_SIZE = 10;

function fmtNum(n: number) { return n.toLocaleString("de-DE"); }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function dayDiff(a: Date, b: Date) { return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000); }

function relativeLabel(d: Date, today: Date) {
  const diff = dayDiff(today, d);
  if (diff <= 0) return "danas";
  if (diff === 1) return "jučer";
  return `prije ${diff} dana`;
}

function dateCell(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${hh}:${mm}`;
}

const STAGE_BADGE: Record<Stage, { cls: string; label: string }> = {
  won: { cls: "badge-won", label: "Won" },
  lost: { cls: "badge-lost", label: "Lost" },
  no_show: { cls: "badge-noshow", label: "No-show" },
  lead: { cls: "badge-lead", label: "Lead" },
  scheduled: { cls: "badge-pending", label: "Zakazano" },
  showed_up: { cls: "badge-pending", label: "Na čekanju" },
};

// Segment metadata — increasing watch depth, increasing colour intensity.
const EVG_SEGMENTS = [
  { key: "noShow" as const, label: "No-show", color: "#454b57" },
  { key: "beforePitch" as const, label: "Otišli pre pitcha", color: "#6b84d9" },
  { key: "reachedPitch" as const, label: "Dočekali pitch", color: "#7895ed" },
  { key: "fullPitch" as const, label: "Full pitch", color: "#a3b8f3" },
];

function fmtDay(iso: string) {
  const [, mm, dd] = iso.split("-");
  return `${dd}.${mm}`;
}

export default function SalesDashboard({ calls, evergreen = [], presetUser }: { calls: CallRow[]; evergreen?: EvergreenDay[]; presetUser?: string }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  // Personalizovani login: ?u=<slug> zaključa ekran na taj nalog (PFP + pozdrav,
  // prima samo njegov PIN). Bez toga = generalni login (bez PFP, bilo koji PIN).
  const presetAccount = useMemo(
    () => ACCOUNTS.find((a) => a.slug === (presetUser || "").toLowerCase()) || null,
    [presetUser]
  );
  const router = useRouter();
  const [screen, setScreen] = useState<"login" | "dept" | "dashboard" | "webinar" | "evergreen">("login");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [user, setUser] = useState<Account | null>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const [range, setRange] = useState<Range>({
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    end: today,
    presetId: "last_30",
  });
  const [pkgMode] = useState<"count" | "revenue">("count");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ---- webinar funnel (live from GHL via /api/webinar) ----
  const [webinar, setWebinar] = useState<WebinarData | null>(null);
  const [webinarLoading, setWebinarLoading] = useState(false);
  const [webinarError, setWebinarError] = useState("");
  // null = pusti API da auto-detektuje aktivni webinar; inače izabrani slug.
  const [webinarSlug, setWebinarSlug] = useState<string | null>(null);
  // ---- evergreen: date-range filter + izbor pojedinačnog webinara ----
  const [evgRange, setEvgRange] = useState<Range>({
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    // end = sutra, da se vidi i webinar u toku (npr. optini za sutra koji već teku)
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    presetId: null,
  });
  const [evgSelected, setEvgSelected] = useState<string>("all"); // "all" (zbirno) ili webinar_date

  const evgAll = useMemo(() => [...evergreen].sort((a, b) => a.date.localeCompare(b.date)), [evergreen]);
  const evgInRange = useMemo(() => {
    const s = evgRange.start.getTime();
    const e = evgRange.end.getTime() + 86400000 - 1;
    return evgAll.filter((d) => { const t = new Date(d.date + "T12:00:00").getTime(); return t >= s && t <= e; });
  }, [evgAll, evgRange]);
  // prikazani dani: pojedinačan izbor (ako je u periodu) ili svi iz perioda
  const evgShown = useMemo(() => {
    if (evgSelected !== "all") {
      const one = evgInRange.find((d) => d.date === evgSelected);
      if (one) return [one];
    }
    return evgInRange;
  }, [evgInRange, evgSelected]);
  const evgSingle = evgShown.length === 1;

  const evg = useMemo(() => {
    const days = evgShown;
    const sum = (f: (d: EvergreenDay) => number) => days.reduce((s, d) => s + f(d), 0);
    const registrants = sum((d) => d.registrants);
    const attendees = sum((d) => d.attendees);
    const noShow = sum((d) => d.noShow);
    const beforePitch = sum((d) => d.beforePitch);
    const reachedPitch = sum((d) => d.reachedPitch);
    const reachedPlus = sum((d) => d.reachedPitch + d.fullPitch);
    const fullPitch = sum((d) => d.fullPitch);
    const conversions = sum((d) => d.conversions);
    // Show-rate/funnel racunaju se SAMO preko odrzanih webinara — predstojeci
    // dan nema attendance (generic segment tagovi bi ga lazno naduvali).
    const occDays = days.filter((d) => d.occurred);
    const occReg = occDays.reduce((s, d) => s + d.registrants, 0);
    const hasOccurred = occDays.length > 0;
    const allUpcoming = days.length > 0 && !hasOccurred;
    const showRate = occReg ? (attendees / occReg) * 100 : 0;
    const withRate = days.map((d) => ({ ...d, rate: d.occurred && d.registrants ? (d.attendees / d.registrants) * 100 : null as number | null }));
    const rated = withRate.filter((d) => d.rate != null);
    const best = rated.length ? rated.reduce((a, b) => (b.rate! > a.rate! ? b : a)) : null;
    const worst = rated.length ? rated.reduce((a, b) => (b.rate! < a.rate! ? b : a)) : null;
    const maxReg = Math.max(1, ...days.map((d) => d.registrants));
    // conversion rate = kupili / došli, po danu (samo održani sa attendance)
    const convRates = withRate.filter((d) => d.occurred && d.attendees).map((d) => (d.conversions / d.attendees) * 100);
    const maxConv = Math.max(0.1, ...convRates);
    const convRate = attendees ? (conversions / attendees) * 100 : 0;
    return { days, withRate, registrants, attendees, noShow, beforePitch, reachedPitch, reachedPlus, fullPitch, conversions, occReg, hasOccurred, allUpcoming, showRate, convRate, maxConv, best, worst, maxReg };
  }, [evgShown]);

  useEffect(() => {
    if (screen !== "webinar") return;
    let cancelled = false;
    setWebinarLoading(true);
    setWebinarError("");
    const url = webinarSlug
      ? `/api/webinar/tibor?webinar=${encodeURIComponent(webinarSlug)}`
      : "/api/webinar/tibor";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: WebinarData) => { if (!cancelled) setWebinar(d); })
      .catch((e) => { if (!cancelled) setWebinarError(e?.message || "Greška pri učitavanju"); })
      .finally(() => { if (!cancelled) setWebinarLoading(false); });
    return () => { cancelled = true; };
  }, [screen, webinarSlug]);

  // Auto-refresh: server vuce GHL/Supabase live (revalidate 60s), ali klijent to
  // ne vidi bez novog zahteva. Dok je korisnik ulogovan i tab vidljiv, osvezavaj
  // server podatke svakih 60s (+ odmah kad se vratis na tab). router.refresh()
  // ponovo povlaci props, a cuva klijentsko stanje (ekran, izabrani period).
  const authed = screen !== "login";
  useEffect(() => {
    if (!authed) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(refreshIfVisible, 60000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [authed, router]);

  function tryLogin() {
    // Personalizovani login prima samo svoj PIN; generalni prima bilo koji.
    const candidates = presetAccount ? [presetAccount] : ACCOUNTS;
    const acct = candidates.find((a) => a.pin === pin);
    if (acct) {
      setUser(acct);
      setScreen("dept");
    } else {
      setPinError("Pogrešan PIN, pokušaj ponovo");
      setPin("");
    }
  }

  // ---- aggregations over the selected range ----
  const filtered = useMemo(() => {
    const s = range.start.getTime();
    const e = range.end.getTime() + 86400000 - 1;
    return calls
      .filter((c) => { const t = new Date(c.date).getTime(); return t >= s && t <= e; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [calls, range]);

  // Lead = lead za zakazivanje poziva (NIJE zakazan poziv) → izdvojen iz metrika
  // poziva i prikazan zasebno. callRows = svi pravi pozivi (Call Booked +).
  const leads = useMemo(() => filtered.filter((c) => c.stage === "lead"), [filtered]);
  const callRows = useMemo(() => filtered.filter((c) => c.stage !== "lead"), [filtered]);

  const stats = useMemo(() => {
    const won = callRows.filter((c) => c.stage === "won");
    const noShow = callRows.filter((c) => c.stage === "no_show").length;
    const revenue = won.reduce((sum, c) => sum + (c.amount || 0), 0);
    const total = callRows.length;
    const conversion = total ? (won.length / total) * 100 : 0;
    const currency = won[0]?.currency || "EUR";
    return { total, wonCount: won.length, notClosed: total - won.length, noShow, revenue, conversion, currency, leadCount: leads.length };
  }, [callRows, leads]);

  const packages = useMemo(() => {
    const won = callRows.filter((c) => c.stage === "won");
    const map = new Map<string, { count: number; revenue: number }>();
    for (const c of won) {
      const key = c.package || "Custom";
      const cur = map.get(key) || { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += c.amount || 0;
      map.set(key, cur);
    }
    const ordered = PACKAGES.map((p) => ({
      name: p.name, color: p.color, price: p.price,
      count: map.get(p.name)?.count || 0,
      revenue: map.get(p.name)?.revenue || 0,
    }));
    for (const [name, v] of Array.from(map.entries())) {
      if (!PACKAGES.some((p) => p.name === name)) {
        ordered.push({ name, color: PACKAGE_FALLBACK_COLOR, price: null, count: v.count, revenue: v.revenue });
      }
    }
    const maxVal = Math.max(1, ...ordered.map((p) => (pkgMode === "count" ? p.count : p.revenue)));
    return ordered.map((p) => ({ ...p, width: ((pkgMode === "count" ? p.count : p.revenue) / maxVal) * 100 }));
  }, [callRows, pkgMode]);

  const lostReasons = useMemo(
    () => callRows.filter((c) => c.stage === "lost" && c.lost_reason),
    [callRows]
  );

  // Tabela "Svi pozivi" prikazuje samo prave pozive (bez Lead-ova).
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return callRows;
    return callRows.filter(
      (c) => (c.contact_name || "").toLowerCase().includes(q) || (c.contact_phone || "").toLowerCase().includes(q)
    );
  }, [callRows, search]);

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pageRows = searched.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const rangeLabel = presetLabel(range.presetId, range.start, range.end, today);

  return (
    <div className="tibor-page">
      {/* LOGIN */}
      <div className={"login-screen" + (screen !== "login" ? " hidden" : "")}>
        <div className="login-card">
          <div className="login-brand" style={{ marginBottom: 28 }}>Tibor <span>· Dashboard</span></div>
          {presetAccount && (
            <div className="login-avatar">
              <img src={presetAccount.photo} alt={presetAccount.name} />
            </div>
          )}
          <div className="login-greeting">Ćao{presetAccount ? `, ${presetAccount.vocative}` : ""} 👋</div>
          <div className="login-greeting-sub">Unesi svoj PIN za pristup</div>
          <input
            ref={pinRef}
            className={"pin-input" + (pinError ? " error" : "")}
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="• • • •"
            autoComplete="off"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && pin.length === 4) tryLogin(); }}
          />
          <div className="pin-error-msg">{pinError}</div>
          <button className="login-btn-primary" disabled={pin.length !== 4} onClick={tryLogin}>Prijavi se</button>
          <div className="login-footer">powered by Floumate</div>
        </div>
      </div>

      {/* DEPARTMENT PICKER */}
      <div className={"dept-screen" + (screen === "dept" ? " visible" : "")}>
        <div className="dept-card">
          <div className="dept-brand">Tibor <span>· Dashboard</span></div>
          <div className="dept-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div>
          <div className="dept-greeting">Ćao, {user?.vocative || "Tibore"} 👋</div>
          <div className="dept-greeting-sub">Odaberi odjel</div>
          <div className="dept-grid">
            <button className="dept-btn setting" type="button" onClick={() => alert("Appointment Setting Department\n\nOvo bi otvorilo postojeći setter tracker. U ovoj verziji aktivan je samo Sales dashboard.")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="dept-name">Appointment Setting</div>
              <div className="dept-desc">Zakazani pozivi, razgovori, follow-up-ovi, conversion rate. Postojeća platforma.</div>
            </button>
            <button className="dept-btn sales" type="button" onClick={() => setScreen("dashboard")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div className="dept-name">Sales</div>
              <div className="dept-desc">Pozivi, zatvoreni paketi, prihod i razlozi za izgubljene prilike.</div>
            </button>
            <button className="dept-btn webinar" type="button" onClick={() => setScreen("webinar")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div className="dept-name">Webinar</div>
              <div className="dept-desc">Launch funnel: prijave, izvori dolaska i broj aplikacija.</div>
            </button>
            <button className="dept-btn evergreen" type="button" onClick={() => setScreen("evergreen")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </div>
              <div className="dept-name">Evergreen webinari</div>
              <div className="dept-desc">Dnevni webinari: show-rate, watch-depth segmenti, po danu i za period.</div>
            </button>
          </div>
          <button className="dept-back" type="button" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>← Odjavi se</button>
        </div>
      </div>

      {/* DASHBOARD — render only when logged in & department chosen, so it
          never flashes underneath the login/department overlays. */}
      {screen === "dashboard" && (
      <>
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">Tibor<em>· Sales Dashboard</em></div>
        <div className="header-right">
          <div className="header-user"><div className="header-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div><span>{user?.name || "Tibor"}</span></div>
          <button className="btn-dept" onClick={() => setScreen("dept")}>↔ Odjeli</button>
          <button className="btn-logout" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>Odjava</button>
        </div>
      </header>

      {/* TAB BAR (decorative) */}
      <nav className="tab-bar">
        <button className="tab-btn active">Pregled</button>
        <button className="tab-btn">Grafikoni</button>
        <button className="tab-btn">Po paketima</button>
        <button className="tab-btn">Razlozi za lost</button>
        <button className="tab-btn">Svi pozivi</button>
      </nav>

      <main className="main-content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Pregled prodaje</div>
            <div className="page-subtitle">{rangeLabel}</div>
          </div>
          <DateRangePicker today={today} committed={range} onApply={(r) => { setRange(r); setPage(1); }} />
        </div>

        {/* KPI */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Leadovi</div>
            <div className="kpi-value">{stats.leadCount}</div>
            <div className="kpi-sub">za zakazivanje poziva</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pozivi</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-sub">zakazani u razdoblju</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Zatvoreno</div>
            <div className="kpi-value green">{stats.wonCount}</div>
            <div className="kpi-sub"><strong>{stats.conversion.toFixed(1)}%</strong> conversion</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Nije zatvoreno</div>
            <div className="kpi-value danger">{stats.notClosed}</div>
            <div className="kpi-sub"><strong>{stats.noShow}</strong> no-show uračunato</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Prihod</div>
            <div className="kpi-value green">{fmtNum(stats.revenue)}</div>
            <div className="kpi-sub">{stats.currency}</div>
          </div>
        </div>

        {/* Packages + Lost reasons */}
        <div className="grid-2">
          <div className="section-card">
            <div className="section-head">
              <div>
                <div className="section-title">Prodaje po paketima</div>
                <div className="section-sub">{stats.wonCount} zatvorenih · {fmtNum(stats.revenue)} {stats.currency}</div>
              </div>
            </div>
            <div className="pkg-list">
              {packages.map((p) => (
                <div className="pkg-row" key={p.name}>
                  <div className="pkg-dot" style={{ background: p.color }} />
                  <div className="pkg-info">
                    <div className="pkg-name">{p.name}</div>
                    <div className="pkg-price-label">{p.price ? `${fmtNum(p.price)} € / kom` : "manualna cijena"}</div>
                  </div>
                  <div className="pkg-bar-wrap"><div className="pkg-bar-fill" style={{ width: `${p.width}%`, background: p.color }} /></div>
                  <div className="pkg-stats">
                    <div className="pkg-count">{p.count}</div>
                    <div className="pkg-revenue">{fmtNum(p.revenue)} €</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <div>
                <div className="section-title">Razlozi za lost</div>
                <div className="section-sub">{lostReasons.length} lost · originalni custom upisi</div>
              </div>
            </div>
            <div className="reasons-wrap">
              {lostReasons.length === 0 && <div className="reasons-empty">Nema izgubljenih poziva u ovom razdoblju.</div>}
              {lostReasons.map((c) => (
                <div className="reason-item" key={c.id}>
                  <div className="reason-quote-mark">&ldquo;</div>
                  <div className="reason-body">
                    <div className="reason-quote">{c.lost_reason}</div>
                    <div className="reason-meta">{c.contact_name} <span className="reason-meta-dot" /> {`${String(new Date(c.date).getDate()).padStart(2, "0")}.${MONTHS_SHORT[new Date(c.date).getMonth()]}`}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="reasons-footer">
              <div className="reasons-footer-info">
                <div className="reasons-footer-icon">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                </div>
                <span>Svaki razlog je tekst koji prodavač ručno upiše nakon poziva</span>
              </div>
              <span className="reasons-footer-count">Prikazano {lostReasons.length} od {lostReasons.length}</span>
            </div>
          </div>
        </div>

        {/* Calls table */}
        <div className="calls-table-wrap">
          <div className="calls-table-head">
            <div>
              <div className="section-title">Svi pozivi</div>
              <div className="section-sub">{searched.length} zapisa · klik na redak za detalje</div>
            </div>
            <input
              className="search-input"
              type="search"
              name="pozivi-pretraga"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              placeholder="Pretraga po imenu, telefonu…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <table>
            <thead>
              <tr>
                <th>Datum</th><th>Lead</th><th>Paket</th><th>Status</th>
                <th style={{ textAlign: "right" }}>Prihod</th><th>Razlog (lost)</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => {
                const badge = STAGE_BADGE[c.stage];
                return (
                  <tr key={c.id}>
                    <td><div className="cell-primary">{dateCell(c.date)}</div><div className="cell-sub">{relativeLabel(new Date(c.date), today)}</div></td>
                    <td><div className="cell-primary">{c.contact_name || "—"}</div><div className="cell-sub">{c.contact_phone || ""}</div></td>
                    <td className={c.package ? "" : "cell-muted"}>{c.package || "—"}</td>
                    <td><span className={"badge " + badge.cls}>{badge.label}</span></td>
                    <td className={c.stage === "won" ? "cell-revenue" : "cell-muted"} style={c.stage === "won" ? undefined : { textAlign: "right" }}>
                      {c.stage === "won" ? `${fmtNum(c.amount)} €` : "—"}
                    </td>
                    <td className={c.stage === "lost" && c.lost_reason ? "cell-quote" : "cell-muted"}>
                      {c.stage === "lost" && c.lost_reason ? `“${c.lost_reason}”` : "—"}
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={6}><div className="table-empty">Nema poziva za prikaz.</div></td></tr>
              )}
            </tbody>
          </table>

          <div className="table-foot">
            <div>Prikazano <strong>{pageRows.length}</strong> od {searched.length}</div>
            <div className="pager">
              <button className="pager-btn" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((n) => (
                <button key={n} className={"pager-btn" + (n === curPage ? " active" : "")} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="pager-btn" disabled={curPage >= totalPages} onClick={() => setPage(curPage + 1)}>›</button>
            </div>
          </div>
        </div>
      </main>
      </>
      )}

      {/* WEBINAR DASHBOARD (launch funnel) */}
      {screen === "webinar" && (
      <>
      <header className="app-header">
        <div className="header-brand">Tibor<em>· Webinar Dashboard</em></div>
        <div className="header-right">
          <div className="header-user"><div className="header-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div><span>{user?.name || "Tibor"}</span></div>
          <button className="btn-dept" onClick={() => setScreen("dept")}>↔ Odjeli</button>
          <button className="btn-logout" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>Odjava</button>
        </div>
      </header>

      <main className="main-content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Launch funnel</div>
            <div className="page-subtitle">velike prijave (GHL tagovi)</div>
          </div>
          {webinar && webinar.availableWebinars?.length > 0 && (
            <select
              className="webinar-select"
              value={webinarSlug ?? webinar.webinar}
              onChange={(e) => setWebinarSlug(e.target.value)}
            >
              {webinar.availableWebinars.map((w) => (
                <option key={w.slug} value={w.slug}>
                  Webinar {w.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {webinarLoading && !webinar && (
          <div className="webinar-state">Učitavam podatke iz GHL-a…</div>
        )}
        {webinarError && !webinar && (
          <div className="webinar-state error">Greška: {webinarError}</div>
        )}

        {webinar && (
          <>
            {/* Prijave — progres ka cilju od 10.000 */}
            {(() => {
              const goal = 10000;
              const pct = Math.min(100, (webinar.optin / goal) * 100);
              const remaining = Math.max(0, goal - webinar.optin);
              return (
                <div className="webinar-goal-card">
                  <div className="webinar-goal-head">
                    <div className="kpi-label">Prijave (optin)</div>
                    <div className="webinar-goal-pct">{pct.toFixed(1)}%</div>
                  </div>
                  <div className="webinar-goal-value">
                    <span className="goal-current">{fmtNum(webinar.optin)}</span>
                    <span className="goal-target"> / {fmtNum(goal)}</span>
                  </div>
                  <div className="webinar-goal-bar">
                    <div className="webinar-goal-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="kpi-sub">
                    {remaining > 0 ? <>jo&scaron; <strong>{fmtNum(remaining)}</strong> do cilja od {fmtNum(goal)}</> : <>cilj od {fmtNum(goal)} postignut 🎉</>}
                  </div>
                </div>
              );
            })()}

            {/* Aplikacije */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Aplikacije</div>
                <div className="kpi-value">{fmtNum(webinar.application)}</div>
                <div className="kpi-sub">
                  <strong>{webinar.optin ? ((webinar.application / webinar.optin) * 100).toFixed(1) : "0"}%</strong> od prijava
                </div>
              </div>
            </div>

            {/* Source breakdown */}
            <div className="section-card">
              <div className="section-head">
                <div>
                  <div className="section-title">Prijave po izvoru</div>
                  <div className="section-sub">{fmtNum(webinar.optin)} prijava · odakle su došli</div>
                </div>
              </div>
              <div className="pkg-list">
                {webinar.sources.length === 0 && (
                  <div className="reasons-empty">Nema tagiranih izvora za ovaj webinar.</div>
                )}
                {webinar.sources.map((s, i) => {
                  const maxVal = Math.max(1, ...webinar.sources.map((x) => x.count));
                  const colors = ["#7895ed", "#a3b8f3", "#cdd6f9", "#6b84d9", "#9aa0aa"];
                  const color = colors[i] || PACKAGE_FALLBACK_COLOR;
                  const pct = webinar.optin ? ((s.count / webinar.optin) * 100).toFixed(1) : "0";
                  return (
                    <div className="pkg-row" key={s.key}>
                      <div className="pkg-dot" style={{ background: color }} />
                      <div className="pkg-info">
                        <div className="pkg-name">{s.label}</div>
                        <div className="pkg-price-label">{pct}% od prijava</div>
                      </div>
                      <div className="pkg-bar-wrap"><div className="pkg-bar-fill" style={{ width: `${(s.count / maxVal) * 100}%`, background: color }} /></div>
                      <div className="pkg-stats">
                        <div className="pkg-count">{fmtNum(s.count)}</div>
                        <div className="pkg-revenue">prijava</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
      </>
      )}

      {/* EVERGREEN DASHBOARD */}
      {screen === "evergreen" && (
      <>
      <header className="app-header">
        <div className="header-brand">Tibor<em>· Evergreen</em></div>
        <div className="header-right">
          <div className="header-user"><div className="header-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div><span>{user?.name || "Tibor"}</span></div>
          <button className="btn-dept" onClick={() => setScreen("dept")}>↔ Odjeli</button>
          <button className="btn-logout" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>Odjava</button>
        </div>
      </header>

      <main className="main-content">
        <div className="page-title-row">
          <div>
            <div className="page-title">{evgSingle && evg.days.length ? `Webinar ${fmtDay(evg.days[0].date)}` : "Evergreen webinari"}</div>
            <div className="page-subtitle">
              {evgShown.length === 0
                ? "nema webinara u periodu"
                : evgSingle
                  ? `pojedinačan webinar · snimak: ${evg.days[0].recording}`
                  : `${fmtDay(evg.days[0].date)}–${fmtDay(evg.days[evg.days.length - 1].date)} · ${evg.days.length} webinara`}
            </div>
          </div>
          <div className="evg-controls">
            <select className="webinar-select" value={evgSelected} onChange={(e) => setEvgSelected(e.target.value)}>
              <option value="all">Svi (zbirno)</option>
              {evgInRange.map((d) => (
                <option key={d.date} value={d.date}>Webinar {fmtDay(d.date)}</option>
              ))}
            </select>
            <DateRangePicker today={today} committed={evgRange} onApply={(r) => { setEvgRange(r); setEvgSelected("all"); }} />
          </div>
        </div>

        {evgAll.length === 0 ? (
          <div className="webinar-state">Nema evergreen podataka još.</div>
        ) : evgShown.length === 0 ? (
          <div className="webinar-state">Nema webinara u izabranom periodu. Proširi period.</div>
        ) : (
          <>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Registranti</div>
                <div className="kpi-value">{fmtNum(evg.registrants)}</div>
                <div className="kpi-sub">{evgSingle ? "1 webinar" : `${evg.days.length} webinara`}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Show-rate</div>
                <div className="kpi-value">{evg.hasOccurred ? evg.showRate.toFixed(1) + "%" : "—"}</div>
                <div className="kpi-sub">{evg.hasOccurred ? `${fmtNum(evg.attendees)} došlo` : "webinar predstoji"}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Dočekali pitch</div>
                <div className="kpi-value">{fmtNum(evg.reachedPlus)}</div>
                <div className="kpi-sub"><strong>{evg.attendees ? ((evg.reachedPlus / evg.attendees) * 100).toFixed(1) : "0"}%</strong> od došlih</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Full pitch</div>
                <div className="kpi-value green">{fmtNum(evg.fullPitch)}</div>
                <div className="kpi-sub"><strong>{evg.attendees ? ((evg.fullPitch / evg.attendees) * 100).toFixed(1) : "0"}%</strong> od došlih</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Kupili</div>
                <div className="kpi-value green">{fmtNum(evg.conversions)}</div>
                <div className="kpi-sub"><strong>{evg.attendees ? ((evg.conversions / evg.attendees) * 100).toFixed(1) : "0"}%</strong> od došlih</div>
              </div>
            </div>

            {!evgSingle ? (
              <div className="section-card">
                <div className="section-head">
                  <div>
                    <div className="section-title">Dnevni pregled</div>
                    <div className="section-sub">registranti po segmentu · show-rate po danu · klik na dan za detalje</div>
                  </div>
                  <div className="evg-legend">
                    {EVG_SEGMENTS.map((s) => (
                      <span className="evg-leg" key={s.key}><i style={{ background: s.color }} />{s.label}</span>
                    ))}
                  </div>
                </div>
                <div className="evg-chart">
                  {evg.withRate.map((d) => {
                    const upcoming = !d.occurred;
                    const segs = upcoming
                      ? [{ c: "#3a3f4a", v: 1, l: "Predstoji" }]
                      : [
                          { c: EVG_SEGMENTS[3].color, v: d.fullPitch, l: "Full pitch" },
                          { c: EVG_SEGMENTS[2].color, v: d.reachedPitch, l: "Dočekali pitch" },
                          { c: EVG_SEGMENTS[1].color, v: d.beforePitch, l: "Otišli pre pitcha" },
                          { c: EVG_SEGMENTS[0].color, v: d.noShow, l: "No-show" },
                        ];
                    const h = (d.registrants / evg.maxReg) * 100;
                    return (
                      <div className="evg-col" key={d.date} onClick={() => setEvgSelected(d.date)} style={{ cursor: "pointer" }}>
                        <div className="evg-rate" title={upcoming ? "webinar predstoji" : undefined}>{upcoming ? "•" : d.rate!.toFixed(0) + "%"}</div>
                        <div className="evg-bar-track">
                          <div className="evg-bar" style={{ height: `${h}%`, opacity: upcoming ? 0.5 : 1 }}>
                            {segs.map((s, i) => (
                              <div key={i} className="evg-seg" style={{ background: s.c, flexGrow: s.v }} title={`${s.l}: ${s.v}`} />
                            ))}
                          </div>
                        </div>
                        <div className="evg-x">{fmtDay(d.date)}</div>
                        <div className="evg-x-sub">{fmtNum(d.registrants)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="section-card">
                <div className="section-head"><div><div className="section-title">Segmenti (watch-depth)</div><div className="section-sub">{fmtNum(evg.registrants)} registranata · gde su otišli</div></div></div>
                {evg.hasOccurred ? (
                  <div className="pkg-list">
                    {[
                      { label: EVG_SEGMENTS[0].label, v: evg.noShow, color: EVG_SEGMENTS[0].color },
                      { label: EVG_SEGMENTS[1].label, v: evg.beforePitch, color: EVG_SEGMENTS[1].color },
                      { label: EVG_SEGMENTS[2].label, v: evg.reachedPitch, color: EVG_SEGMENTS[2].color },
                      { label: EVG_SEGMENTS[3].label, v: evg.fullPitch, color: EVG_SEGMENTS[3].color },
                    ].map((s) => (
                      <div className="pkg-row" key={s.label}>
                        <div className="pkg-dot" style={{ background: s.color }} />
                        <div className="pkg-info">
                          <div className="pkg-name">{s.label}</div>
                          <div className="pkg-price-label">{evg.registrants ? ((s.v / evg.registrants) * 100).toFixed(1) : "0"}% od registranata</div>
                        </div>
                        <div className="pkg-bar-wrap"><div className="pkg-bar-fill" style={{ width: `${evg.registrants ? (s.v / evg.registrants) * 100 : 0}%`, background: s.color }} /></div>
                        <div className="pkg-stats"><div className="pkg-count">{fmtNum(s.v)}</div></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reasons-empty">Webinar još nije počeo (20:00) — attendance i segmenti biće dostupni po početku. Za sada: <strong>{fmtNum(evg.registrants)}</strong> prijava.</div>
                )}
              </div>
            )}

            {!evgSingle && (
              <div className="section-card">
                <div className="section-head">
                  <div>
                    <div className="section-title">Conversion rate po danu</div>
                    <div className="section-sub">kupili / došli · po webinaru · prosek {evg.convRate.toFixed(1)}%</div>
                  </div>
                </div>
                {(() => {
                  const pts = evg.withRate.map((d, i) => ({
                    i, date: d.date, kup: d.conversions,
                    rate: d.occurred && d.attendees ? (d.conversions / d.attendees) * 100 : null as number | null,
                  }));
                  const dx = 62, padT = 30, plotH = 150, padB = 42, sidePad = dx / 2;
                  const W = Math.max(pts.length, 1) * dx;
                  const H = padT + plotH + padB;
                  const maxY = evg.maxConv;
                  const baseY = padT + plotH;
                  const xOf = (i: number) => sidePad + i * dx;
                  const yOf = (r: number) => baseY - (r / maxY) * plotH;
                  const line = pts.filter((p) => p.rate != null);
                  const dLine = line.map((p, k) => `${k === 0 ? "M" : "L"} ${xOf(p.i)} ${yOf(p.rate!)}`).join(" ");
                  const dArea = line.length ? `${dLine} L ${xOf(line[line.length - 1].i)} ${baseY} L ${xOf(line[0].i)} ${baseY} Z` : "";
                  const avgY = yOf(Math.min(evg.convRate, maxY));
                  return (
                    <div className="evg-line-wrap">
                      <svg className="evg-line-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img">
                        <defs>
                          <linearGradient id="convgrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5fb59a" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#5fb59a" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line x1={0} y1={baseY} x2={W} y2={baseY} stroke="rgba(255,255,255,0.10)" />
                        {evg.convRate > 0 && (
                          <>
                            <line x1={0} y1={avgY} x2={W} y2={avgY} stroke="rgba(95,181,154,0.45)" strokeWidth={1} strokeDasharray="4 4" />
                            <text x={W - 6} y={avgY - 5} textAnchor="end" className="evg-line-avg">prosek {evg.convRate.toFixed(1)}%</text>
                          </>
                        )}
                        {dArea && <path d={dArea} fill="url(#convgrad)" />}
                        {dLine && <path d={dLine} fill="none" stroke="#5fb59a" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                        {pts.map((p) => (
                          <g key={p.date}>
                            {p.rate != null && <circle cx={xOf(p.i)} cy={yOf(p.rate)} r={3.5} fill="var(--bg)" stroke="#5fb59a" strokeWidth={2} />}
                            {p.rate != null && <text x={xOf(p.i)} y={yOf(p.rate) - 10} textAnchor="middle" className="evg-line-val">{p.rate.toFixed(1)}%</text>}
                            <text x={xOf(p.i)} y={baseY + 20} textAnchor="middle" className="evg-line-x">{fmtDay(p.date)}</text>
                            <text x={xOf(p.i)} y={baseY + 34} textAnchor="middle" className="evg-line-xsub">{p.rate == null ? "•" : p.kup}</text>
                            <rect x={xOf(p.i) - dx / 2} y={padT} width={dx} height={plotH + padB} fill="transparent" style={{ cursor: "pointer" }} onClick={() => setEvgSelected(p.date)}>
                              <title>{p.rate == null ? `${fmtDay(p.date)} — predstoji` : `${fmtDay(p.date)}: ${p.rate.toFixed(1)}% · ${p.kup} kupili`}</title>
                            </rect>
                          </g>
                        ))}
                      </svg>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid-2">
              <div className="section-card">
                <div className="section-head"><div><div className="section-title">Funnel{evgSingle ? "" : " (zbirno)"}</div><div className="section-sub">{evgSingle ? `webinar ${fmtDay(evg.days[0].date)}` : `${evg.days.length} webinara u periodu`}</div></div></div>
                <div className="pkg-list">
                  {[
                    { label: "Registranti", v: evg.registrants, color: "#6b84d9" },
                    { label: "Došli", v: evg.attendees, color: "#7895ed" },
                    { label: "Dočekali pitch", v: evg.reachedPlus, color: "#8ea4f0" },
                    { label: "Full pitch", v: evg.fullPitch, color: "#a3b8f3" },
                    { label: "Kupili", v: evg.conversions, color: "#5fb59a" },
                  ].map((step) => (
                    <div className="pkg-row" key={step.label}>
                      <div className="pkg-dot" style={{ background: step.color }} />
                      <div className="pkg-info">
                        <div className="pkg-name">{step.label}</div>
                        <div className="pkg-price-label">{evg.registrants ? ((step.v / evg.registrants) * 100).toFixed(1) : "0"}% od registranata</div>
                      </div>
                      <div className="pkg-bar-wrap"><div className="pkg-bar-fill" style={{ width: `${evg.registrants ? (step.v / evg.registrants) * 100 : 0}%`, background: step.color }} /></div>
                      <div className="pkg-stats"><div className="pkg-count">{fmtNum(step.v)}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              {!evgSingle && evg.best && evg.worst ? (
                <div className="section-card">
                  <div className="section-head"><div><div className="section-title">Najbolji / najslabiji dan</div><div className="section-sub">po show-rate-u</div></div></div>
                  <div className="evg-bw">
                    <div className="evg-bw-item best">
                      <div className="evg-bw-tag">Najbolji</div>
                      <div className="evg-bw-day">{fmtDay(evg.best.date)}</div>
                      <div className="evg-bw-rate">{evg.best.rate!.toFixed(1)}%</div>
                      <div className="evg-bw-sub">{fmtNum(evg.best.attendees)}/{fmtNum(evg.best.registrants)} · {evg.best.fullPitch} full</div>
                    </div>
                    <div className="evg-bw-item worst">
                      <div className="evg-bw-tag">Najslabiji</div>
                      <div className="evg-bw-day">{fmtDay(evg.worst.date)}</div>
                      <div className="evg-bw-rate">{evg.worst.rate!.toFixed(1)}%</div>
                      <div className="evg-bw-sub">{fmtNum(evg.worst.attendees)}/{fmtNum(evg.worst.registrants)} · {evg.worst.fullPitch} full</div>
                    </div>
                  </div>
                  <div className="reasons-footer">
                    <div className="reasons-footer-info"><span>Kupili = broj bought_eun tagova po webinaru (GHL).</span></div>
                  </div>
                </div>
              ) : (
                <div className="section-card">
                  <div className="section-head"><div><div className="section-title">Detalji webinara</div><div className="section-sub">{fmtDay(evg.days[0].date)}</div></div></div>
                  <div className="evg-detail">
                    <div className="evg-detail-row"><span>Snimak</span><strong>{evg.days[0].recording || "—"}</strong></div>
                    <div className="evg-detail-row"><span>Show-rate</span><strong>{evg.hasOccurred ? evg.showRate.toFixed(1) + "%" : "predstoji"}</strong></div>
                    <div className="evg-detail-row"><span>Full pitch od došlih</span><strong>{evg.attendees ? ((evg.fullPitch / evg.attendees) * 100).toFixed(1) : "0"}%</strong></div>
                    <div className="evg-detail-row"><span>Kupili</span><strong>{fmtNum(evg.conversions)} · {evg.attendees ? ((evg.conversions / evg.attendees) * 100).toFixed(1) : "0"}% od došlih</strong></div>
                  </div>
                  <div className="reasons-footer">
                    <div className="reasons-footer-info"><span>Kupili = broj bought_eun tagova po webinaru (GHL).</span></div>
                  </div>
                </div>
              )}
            </div>

            {!evgSingle && (
              <div className="calls-table-wrap">
                <div className="calls-table-head"><div><div className="section-title">Po danu</div><div className="section-sub">{evg.days.length} webinara · klik na red za pojedinačan webinar</div></div></div>
                <table>
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th style={{ textAlign: "right" }}>Reg</th>
                      <th style={{ textAlign: "right" }}>Došli</th>
                      <th style={{ textAlign: "right" }}>Show</th>
                      <th style={{ textAlign: "right" }}>&lt;pitch</th>
                      <th style={{ textAlign: "right" }}>Pitch</th>
                      <th style={{ textAlign: "right" }}>Full</th>
                      <th style={{ textAlign: "right" }}>Kupili</th>
                      <th>Snimak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...evg.withRate].reverse().map((d) => (
                      <tr key={d.date} onClick={() => setEvgSelected(d.date)} style={{ cursor: "pointer" }}>
                        <td><div className="cell-primary">{fmtDay(d.date)}</div></td>
                        <td style={{ textAlign: "right" }}>{fmtNum(d.registrants)}</td>
                        <td style={{ textAlign: "right" }}>{fmtNum(d.attendees)}</td>
                        <td style={{ textAlign: "right" }} className={d.rate == null ? "cell-muted" : "cell-revenue"}>{d.rate == null ? "predstoji" : d.rate.toFixed(1) + "%"}</td>
                        <td style={{ textAlign: "right" }} className="cell-muted">{d.beforePitch}</td>
                        <td style={{ textAlign: "right" }} className="cell-muted">{d.reachedPitch}</td>
                        <td style={{ textAlign: "right" }} className="cell-revenue">{d.fullPitch}</td>
                        <td style={{ textAlign: "right" }} className="cell-revenue">{d.conversions}</td>
                        <td className="cell-muted">{d.recording}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      </>
      )}
    </div>
  );
}
