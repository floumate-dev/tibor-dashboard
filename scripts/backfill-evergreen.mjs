// Backfill evergreen webinar attendance from AEvent registrant CSVs.
//
//   node scripts/backfill-evergreen.mjs          # write to Supabase (upsert)
//   node scripts/backfill-evergreen.mjs --dry     # parse + print only, no writes
//
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Segment logic mirrors Tibor/daily_tag.py exactly; thresholds are per-day
// (tied to the recording). Idempotent: re-running upserts the same rows.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const DL = path.join(homedir(), "Downloads");

// Internal test accounts — excluded (same as daily_tag.py).
const INTERNAL = new Set(["dusan@floumate.com", "danilotest@gmail.com", "danilo@floumate.com"]);

// One entry per evergreen webinar day. csv = exact filename in ~/Downloads
// (NN does NOT match the date — mapping verified against each file's Webinar
// Date column). Thresholds in minutes-of-day, Europe/Belgrade:
//   old recording (through 03.07): pitch 20:45, full 21:00
//   new recording (from 04.07, len 01:37:32): pitch 20:59, full 21:06:14
const OLD = { pitch: 20 * 60 + 45, full: 21 * 60 + 0, rec: "old" };
const NEW = { pitch: 20 * 60 + 59, full: 21 * 60 + 6 + 14 / 60, rec: "new (01:37:32)" };
const DAYS = [
  { date: "2026-06-30", csv: "registrant-download-36.csv", ...OLD },
  { date: "2026-07-01", csv: "registrant-download-37.csv", ...OLD },
  { date: "2026-07-02", csv: "registrant-download-35 (1).csv", ...OLD },
  { date: "2026-07-03", csv: "registrant-download-39.csv", ...OLD },
  { date: "2026-07-04", csv: "registrant-download-38.csv", ...NEW },
  { date: "2026-07-05", csv: "registrant-download-40.csv", ...NEW },
  { date: "2026-07-06", csv: "registrant-download-41.csv", ...NEW },
  { date: "2026-07-07", csv: "registrant-download-42.csv", ...NEW },
];

// ---- env ----
function loadEnv() {
  const out = {};
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

// ---- minimal RFC4180 CSV parser (handles quotes, commas, embedded newlines) ----
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

// ---- segment logic (ported 1:1 from daily_tag.py) ----
function watchMin(s) {
  s = s || "";
  const h = /(\d+)H/.exec(s), m = /(\d+)M/.exec(s), sec = /(\d+)S/.exec(s);
  return (h ? +h[1] : 0) * 60 + (m ? +m[1] : 0) + (sec ? +sec[1] : 0) / 60;
}
function joinMinute(s) {
  const m = /(\d+):(\d+)\s*([AP]M)/i.exec(s || "");
  if (!m) return null;
  const hh = (+m[1] % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0);
  return hh * 60 + +m[2];
}
function normPhone(p) {
  p = (p || "").trim();
  if (!p || p.toUpperCase() === "N/A") return "";
  p = p.replace(/[ \-()]/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  return "+" + p;
}
// segment: 1 no-show, 2 <pitch, 3 reached-pitch, 4 full-pitch
function segmentOf(r, pitch, full) {
  const attended = (r["Attended"] || "").trim().toLowerCase() === "yes";
  if (!attended) return { seg: 1, attended: false, join: null, watch: 0 };
  const watch = watchMin(r["Total Attendance Time"]);
  let join = joinMinute(r["Join Time"]);
  if (join == null) join = 20 * 60; // fallback = webinar start
  const left = join + watch;
  const present = (X) => join <= X && X <= left;
  const seg = present(full) ? 4 : present(pitch) ? 3 : 2;
  return { seg, attended: true, join, watch };
}

async function main() {
  let sb = null, orgId = null;
  if (!DRY) {
    const env = loadEnv();
    const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase creds in .env.local");
    sb = createClient(url, key, { auth: { persistSession: false } });
    const { data: org } = await sb.from("organizations").select("id").eq("slug", "tibor").single();
    if (!org) throw new Error("tibor org not found");
    orgId = org.id;
  }

  console.log(DRY ? "DRY RUN — no writes\n" : "Writing to Supabase (mneo)\n");
  const head = "Day         reg  no-show  <pitch  pitch  full  attend  show%   thresholds";
  console.log(head);
  console.log("-".repeat(head.length));

  for (const day of DAYS) {
    let text;
    try { text = readFileSync(path.join(DL, day.csv), "utf8"); }
    catch { console.log(`${day.date}  MISSING ${day.csv}`); continue; }
    const rows = parseCSV(text);

    const attendeeRows = [];
    const seen = new Set();
    const cnt = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let skipped = 0;
    for (const r of rows) {
      const email = (r["Email"] || "").trim().toLowerCase();
      if (!email || INTERNAL.has(email)) { skipped++; continue; }
      if (seen.has(email)) continue; // dedupe within a day
      seen.add(email);
      const { seg, attended, join, watch } = segmentOf(r, day.pitch, day.full);
      cnt[seg]++;
      attendeeRows.push({
        org_id: orgId,
        webinar_date: day.date,
        email,
        phone: normPhone(r["Phone"]) || null,
        attended,
        join_min: join,
        watch_min: Math.round(watch * 100) / 100,
        segment: seg,
      });
    }
    const reg = attendeeRows.length;
    const attend = cnt[2] + cnt[3] + cnt[4];
    const showPct = reg ? ((attend / reg) * 100).toFixed(1) : "0.0";
    console.log(
      `${day.date}  ${String(reg).padStart(3)}  ${String(cnt[1]).padStart(7)}  ${String(cnt[2]).padStart(6)}  ${String(cnt[3]).padStart(5)}  ${String(cnt[4]).padStart(4)}  ${String(attend).padStart(6)}  ${showPct.padStart(5)}   ${day.rec}`
    );

    if (DRY) continue;

    // upsert attendees in chunks
    for (let i = 0; i < attendeeRows.length; i += 500) {
      const chunk = attendeeRows.slice(i, i + 500);
      const { error } = await sb.from("evergreen_attendees").upsert(chunk, { onConflict: "org_id,webinar_date,email" });
      if (error) throw new Error(`attendees upsert ${day.date}: ${error.message}`);
    }
    // upsert daily aggregate
    const { error: e2 } = await sb.from("evergreen_webinars").upsert({
      org_id: orgId,
      webinar_date: day.date,
      recording_label: day.rec,
      pitch_start_min: day.pitch,
      full_pitch_min: Math.round(day.full * 1000) / 1000,
      registrants: reg,
      attendees: attend,
      seg_no_show: cnt[1],
      seg_before_pitch: cnt[2],
      seg_reached_pitch: cnt[3],
      seg_full_pitch: cnt[4],
      updated_at: new Date().toISOString(),
    }, { onConflict: "org_id,webinar_date" });
    if (e2) throw new Error(`webinar upsert ${day.date}: ${e2.message}`);
  }
  console.log(DRY ? "\n(dry — nothing written)" : "\nDone.");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
