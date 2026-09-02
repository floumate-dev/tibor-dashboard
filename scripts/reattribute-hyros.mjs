// Re-attribute the weak (purchase_time) evergreen sales using Hyros identity
// data. Hyros 'Sale Group' == Stripe charge id (exact join) and Hyros carries
// PHONE numbers Stripe lacks, so we retry the GHL match by Hyros phone/email.
// A match -> reliable optin day; no match even by phone -> the buyer never
// registered for the webinar (direct-ad sale) -> honest unattributed (null).
//   node scripts/reattribute-hyros.mjs            # DRY
//   node scripts/reattribute-hyros.mjs --apply
import pg from "pg";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { attributeSale } from "../src/lib/evergreen-sales.ts";

const APPLY = process.argv.includes("--apply");
const HYROS = "/Users/dusan/Downloads/2026-09-02 13_34_18.0-S3-SALES Export for 216303.csv";

function parse(t) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c !== "\r") f += c; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift().map((x) => x.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? "").trim()])));
}
const phonesOf = (s) => (s || "").split(/[|;, ]+/).map((x) => x.trim()).filter((x) => x && x !== "-" && /\d{6,}/.test(x));

const env = {};
for (const l of readFileSync("/Users/dusan/Tracking/.env.local", "utf8").split(/\r?\n/)) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) env[m[1]] = m[2]; }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const hy = parse(readFileSync(HYROS, "utf8"));
const byId = {}; for (const r of hy) if (r["Sale Group"]) byId[r["Sale Group"]] = r;

const password = readFileSync("/Users/dusan/Tracking/scripts/.dbpass", "utf8").trim();
const pgc = new pg.Client({ host: "aws-0-eu-west-3.pooler.supabase.com", port: 5432, user: "postgres.mneoavdbfpqgwzzhttnx", password, database: "postgres", ssl: { rejectUnauthorized: false } });
await pgc.connect();
const org = (await pgc.query("select id from organizations where slug='tibor'")).rows[0].id;
const weak = (await pgc.query("select stripe_id, email, phone, paid_at, webinar_date from evergreen_sales where org_id=$1 and attribution='purchase_time' and not refunded", [org])).rows;
await pgc.end();
console.log("purchase_time redova za re-atribuciju:", weak.length);

let recovered = 0, stillNo = 0, changedDay = 0; let i = 0;
const results = [];
const worker = async () => {
  while (i < weak.length) {
    const s = weak[i++];
    const h = byId[s.stripe_id] || {};
    const hemail = (h.Email || "").toLowerCase() || (s.email || "");
    const phs = phonesOf(h.Phones);
    let best = null;
    for (const ph of [s.phone, ...phs].filter(Boolean)) {
      const attr = await attributeSale(sb, env.GHL_TIBOR_TOKEN, org, hemail, ph, new Date(s.paid_at).toISOString());
      if (attr.attribution === "optin" || attr.attribution === "attended" || attr.attribution === "phone_optin") { best = attr; break; }
    }
    if (best) {
      recovered++;
      if (best.webinar_date !== s.webinar_date) changedDay++;
      results.push({ id: s.stripe_id, from: s.webinar_date, to: best.webinar_date, via: best.attribution });
      if (APPLY) await sb.from("evergreen_sales").update({ webinar_date: best.webinar_date, attribution: "hyros_" + best.attribution, updated_at: new Date().toISOString() }).eq("org_id", org).eq("stripe_id", s.stripe_id);
    } else {
      stillNo++;
      // never registered for the webinar (no GHL optin by any key) -> honest unattributed
      if (APPLY) await sb.from("evergreen_sales").update({ webinar_date: null, attribution: "unmatched", updated_at: new Date().toISOString() }).eq("org_id", org).eq("stripe_id", s.stripe_id);
    }
    await new Promise((r) => setTimeout(r, 120));
  }
};
await Promise.all([worker(), worker()]);

console.log(`\nRECOVERED (našao optin preko Hyros telefona/emaila): ${recovered} | od toga promenjen dan: ${changedDay}`);
console.log(`I DALJE bez GHL optina (nikad se nije prijavio → unattributed): ${stillNo}`);
console.log("\nprimeri (from -> to):", results.slice(0, 8));
console.log(APPLY ? "\nAPPLIED (dan + attribution azurirani; trigger sinhronizovao conversions)." : "\n(DRY — nista upisano. --apply za pravo.)");
process.exit(0);
