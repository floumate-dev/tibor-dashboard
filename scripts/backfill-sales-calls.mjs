// Rebuild the Sales department `calls` table from iClosed (the real source for
// Mlađan's strategy calls) + Stripe/Hyros for closes. The old rows were stale
// GHL-pipeline data (dead since June, €0 revenue). Rule (from Tibor): a
// high-ticket Stripe sale counts as a Mlađan CLOSE only if that buyer has a
// booked iClosed call; buyers without a booked call belong elsewhere (TBD).
//
// Mapping per iClosed contact:
//   not booked                       -> stage "lead"      (top of funnel)
//   booked + matched high-ticket buy -> stage "won"       (amount = Stripe net)
//   booked + "Call cancelled"        -> stage "lost"      (reason: Otkazan poziv)
//   booked otherwise                 -> stage "scheduled" (call held/pending)
//
//   node scripts/backfill-sales-calls.mjs            # DRY (counts only)
//   node scripts/backfill-sales-calls.mjs --apply    # backup + replace tibor calls
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { listCharges } from "../src/lib/evergreen-sales.ts";

const APPLY = process.argv.includes("--apply");
const ICLOSED = "/tmp/iclosed.csv";
const HYROS = "/Users/dusan/Downloads/2026-09-02 13_34_18.0-S3-SALES Export for 216303.csv";
const HIGH_TICKET_CENTS = 20000; // €200+  = Korak Ispred (excludes evergreen 47/97.99/98/141/100)

const Q = String.fromCharCode(34);
function parse(t) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === Q) { if (t[i + 1] === Q) { f += Q; i++; } else q = false; } else f += c; }
    else if (c === Q) q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c !== "\r") f += c; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift().map((x) => x.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? "").trim()])));
}
const norm = (p) => (p || "").replace(/[^0-9]/g, "").slice(-9);

const env = {};
for (const l of readFileSync("/Users/dusan/Tracking/.env.local", "utf8").split(/\r?\n/)) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) env[m[1]] = m[2]; }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: org } = await sb.from("organizations").select("id").eq("slug", "tibor").single();
const orgId = org.id;

// --- high-ticket buyers from Stripe (net) + Hyros phones ---
const hy = parse(readFileSync(HYROS, "utf8"));
const hyById = {}; for (const r of hy) if (r["Sale Group"]) hyById[r["Sale Group"]] = r;
const since = Math.floor(new Date("2026-06-01T00:00:00Z").getTime() / 1000);
const ch = (await listCharges(env.STRIPE_TIBOR_KEY, since)).filter((c) => c.paid && c.amount >= HIGH_TICKET_CENTS);
const buyers = {}; // email -> {phones:Set, net, lastSale}
for (const c of ch) {
  const e = (c.billing_details?.email || "").toLowerCase();
  const h = hyById[c.id] || {};
  const ph = norm((h.Phones || "").split(/[|;, ]+/).find((x) => /[0-9]{6,}/.test(x)) || "");
  const b = (buyers[e] = buyers[e] || { email: e, phones: new Set(), net: 0, lastSale: null });
  if (ph) b.phones.add(ph);
  if (!c.refunded) b.net += c.amount / 100;
  const d = new Date(c.created * 1000).toISOString();
  if (!b.lastSale || d > b.lastSale) b.lastSale = d;
}
// index buyers by email + phone for matching
const buyerByEmail = new Map(), buyerByPhone = new Map();
for (const b of Object.values(buyers)) { if (b.email) buyerByEmail.set(b.email, b); for (const p of b.phones) buyerByPhone.set(p, b); }

// --- iClosed contacts -> call rows ---
const ic = parse(readFileSync(ICLOSED, "utf8"));
const isBooked = (r) => Number(r["No. of strategy calls"] || 0) >= 1 || /BOOKED|QUALIFIED/.test(r["Scheduling status"]);
const rows = [];
const usedIds = new Set(); // unique index on (org_id, external_id) — suffix collisions
const tally = { lead: 0, scheduled: 0, won: 0, lost: 0 };
let revenue = 0;
for (const r of ic) {
  const contact = (r["Contact"] || "").trim();
  const email = contact.includes("@") ? contact.toLowerCase() : null;
  const phone = (r["Phone Number"] || "").trim();
  const p9 = norm(phone);
  const name = `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim() || null;
  const created = r["Contact Creation Date"] ? new Date(r["Contact Creation Date"].replace(" ", "T") + "Z").toISOString() : new Date().toISOString();
  const booked = isBooked(r);
  const buyer = (email && buyerByEmail.get(email)) || (p9 && buyerByPhone.get(p9)) || null;

  let stage, amount = 0, pkg = null, lost_reason = null, closed_at = null, scheduled_at = created;
  if (!booked) {
    stage = "lead";
  } else if (buyer) {
    stage = "won"; amount = buyer.net; pkg = "Korak Ispred"; closed_at = buyer.lastSale; scheduled_at = buyer.lastSale || created;
    revenue += amount;
  } else if ((r["Last Interaction Type"] || "") === "Call cancelled") {
    stage = "lost"; lost_reason = "Otkazan poziv";
  } else {
    stage = "scheduled";
  }
  tally[stage]++;
  let extId = "iclosed:" + (email || p9 || Math.random().toString(36).slice(2));
  if (usedIds.has(extId)) { let k = 2; while (usedIds.has(`${extId}#${k}`)) k++; extId = `${extId}#${k}`; }
  usedIds.add(extId);
  rows.push({
    org_id: orgId,
    external_id: extId,
    contact_name: name,
    contact_email: email,
    contact_phone: phone || null,
    package: pkg,
    amount,
    currency: "EUR",
    stage,
    lost_reason,
    setter: null,
    closer: booked ? "Mlađan" : null,
    source: r["UTM Source"] || r["UTM Campaign"] || "iclosed",
    scheduled_at,
    closed_at,
    raw_data: { scheduling_status: r["Scheduling status"], strategy_calls: r["No. of strategy calls"], last_interaction: r["Last Interaction Type"] },
  });
}

console.log("iClosed kontakata:", ic.length);
console.log("rows:", rows.length, "| stage:", JSON.stringify(tally));
console.log("WON (Mlađan closovi):", tally.won, "| prihod €" + revenue);

if (!APPLY) { console.log("\n(DRY — ništa upisano. --apply za backup+zamenu.)"); process.exit(0); }

// backup current tibor calls, then replace. Never clobber an existing non-empty
// backup with an empty one (e.g. re-run after a failed insert left calls empty).
const { data: old } = await sb.from("calls").select("*").eq("org_id", orgId);
if ((old?.length || 0) > 0) {
  const backup = `/Users/dusan/Tracking/scripts/backup-calls-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backup, JSON.stringify(old, null, 2));
  console.log(`\nbackup ${old.length} starih calls -> ${backup}`);
} else {
  console.log("\n(nema starih calls za backup — preskačem)");
}
const { error: delErr } = await sb.from("calls").delete().eq("org_id", orgId);
if (delErr) { console.error("delete error:", delErr.message); process.exit(1); }
// insert in chunks
let ins = 0;
for (let i = 0; i < rows.length; i += 200) {
  const { error } = await sb.from("calls").insert(rows.slice(i, i + 200));
  if (error) { console.error("insert error:", error.message); process.exit(1); }
  ins += rows.slice(i, i + 200).length;
}
console.log(`upisano ${ins} novih calls (iClosed-based).`);
process.exit(0);
