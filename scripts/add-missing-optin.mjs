// Reconcile GHL optin tags with AEvent CSV: add evergreen_webinar_<DD_MM_YY>_optin
// to CSV registrants (the source of truth) who exist in GHL but lack the tag.
//   node scripts/add-missing-optin.mjs           # DRY — analyze only, no writes
//   node scripts/add-missing-optin.mjs --apply    # actually add the tags
//
// ⚠️ --apply WRITES tags to live GHL contacts. If a workflow triggers on the
// dated optin tag, this could fire messages for PAST webinars. Confirm the
// optin tag has no active messaging workflow before using --apply.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const LOC = "Zyilin5HFiDuC461lVdk";
const BASE = "https://services.leadconnectorhq.com";
const DL = path.join(homedir(), "Downloads");
const INTERNAL = new Set(["dusan@floumate.com", "danilotest@gmail.com", "danilo@floumate.com"]);

const DAYS = [
  { date: "2026-06-30", csv: "registrant-download-36 (1).csv" },
  { date: "2026-07-01", csv: "registrant-download-37 (1).csv" },
  { date: "2026-07-02", csv: "registrant-download-35 (2).csv" },
  { date: "2026-07-03", csv: "registrant-download-39 (1).csv" },
  { date: "2026-07-04", csv: "registrant-download-38 (1).csv" },
  { date: "2026-07-05", csv: "registrant-download-40 (1).csv" },
  { date: "2026-07-06", csv: "registrant-download-41.csv" },
  { date: "2026-07-07", csv: "registrant-download-42.csv" },
];

function loadEnv() { const o = {}; for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) o[m[1]] = m[2]; } return o; }
const TOKEN = loadEnv().GHL_TIBOR_TOKEN;
const H = { Authorization: `Bearer ${TOKEN}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json", "User-Agent": "floumate-tagger/1.0" };
function stampOf(iso) { const [y, m, d] = iso.split("-"); return `${d}_${m}_${y.slice(2)}`; }
function parseCSV(text) { const rows = []; let row = [], f = "", q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c !== "\r") f += c; } if (f.length || row.length) { row.push(f); rows.push(row); } const h = rows.shift().map((x) => x.trim()); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""]))); }

async function post(url, body) { const r = await fetch(BASE + url, { method: "POST", headers: H, body: JSON.stringify(body) }); if (!r.ok) throw new Error(`POST ${url} ${r.status} ${(await r.text()).slice(0, 120)}`); return r.json(); }
async function get(url) { const r = await fetch(BASE + url, { headers: H }); if (!r.ok) throw new Error(`GET ${r.status}`); return r.json(); }
async function addTags(id, tags) { const r = await fetch(BASE + `/contacts/${id}/tags`, { method: "POST", headers: H, body: JSON.stringify({ tags }) }); return r.status; }

// all lowercased emails that already carry a tag
async function emailsWithTag(tag) {
  const out = new Set(); let total = null, body = { locationId: LOC, pageLimit: 100, filters: [{ field: "tags", operator: "contains", value: tag }] };
  for (let i = 0; i < 100; i++) { const d = await post("/contacts/search", body); if (total == null) total = Number(d.total) || 0; const cs = d.contacts || []; for (const c of cs) if (c.email) out.add(c.email.toLowerCase()); const sa = cs.length ? cs[cs.length - 1].searchAfter : null; if (!cs.length || out.size >= total || !sa) break; body.searchAfter = sa; }
  return { emails: out, total };
}
async function findId(email) { const q = new URLSearchParams({ locationId: LOC, email }); const d = await get("/contacts/search/duplicate?" + q); return d?.contact?.id || null; }

console.log(APPLY ? "APPLY — writing optin tags to GHL\n" : "DRY — analyze only, no writes\n");
console.log("Day         CSV   GHL-optin  CSV-ima-tag  CSV-fali-tag" + (APPLY ? "   dodato  nije-u-GHL  err" : ""));
console.log("-".repeat(APPLY ? 90 : 62));
let grandMissing = 0;
for (const day of DAYS) {
  const rows = parseCSV(readFileSync(path.join(DL, day.csv), "utf8"));
  const csvEmails = [...new Set(rows.map((r) => (r["Email"] || "").trim().toLowerCase()).filter((e) => e && !INTERNAL.has(e)))];
  const stamp = stampOf(day.date);
  const optin = `evergreen_webinar_${stamp}_optin`;
  // SAFETY: only ever the DATED optin tag; never the generic trigger tag.
  if (optin === "evergreen_webinar_optin" || !stamp) throw new Error("SAFETY: odbijam generic/prazni optin tag");
  const { emails: tagged, total } = await emailsWithTag(optin);
  const hasTag = csvEmails.filter((e) => tagged.has(e)).length;
  const missing = csvEmails.filter((e) => !tagged.has(e));
  grandMissing += missing.length;
  let added = 0, notInGhl = 0, errs = 0;
  if (APPLY) {
    for (const email of missing) {
      const id = await findId(email);
      if (!id) { notInGhl++; continue; }
      const s = await addTags(id, [optin]);
      if (s === 200 || s === 201) added++;
      else if (s === 401 || s === 403) throw new Error(`GHL ${s}: token nema contacts.write scope. Napravi token sa Edit Contacts dozvolom.`);
      else errs++;
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  console.log(`${day.date}  ${String(csvEmails.length).padStart(3)}   ${String(total).padStart(9)}  ${String(hasTag).padStart(11)}  ${String(missing.length).padStart(12)}` + (APPLY ? `   ${String(added).padStart(6)}  ${String(notInGhl).padStart(10)}  ${String(errs).padStart(3)}` : ""));
}
console.log(`\nUkupno CSV registranata bez optin taga: ${grandMissing}`);
console.log(APPLY ? "Gotovo." : "\n(DRY — ništa nije upisano. Za pravo: --apply)");
