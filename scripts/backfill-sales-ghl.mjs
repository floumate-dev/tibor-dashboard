// Rebuild the Sales `calls` table from the GHL "Sales Pipeline" (Mlađan's real
// pipeline: Lead > Call Booked > Didn't Show > Showed > Follow Up > Deposit
// Collected > Won > Lost). This is the source the live GHL webhook already feeds
// (workflow "03 - to Dashboard" -> /api/webhooks/ghl/tibor), so backfilling from
// the same source with the same key (external_id = GHL opportunity id) means the
// webhook updates these rows instead of duplicating them. Replaces the earlier
// iClosed-export backfill (which used email keys -> duplicated live GHL rows).
// Money (won amount) still comes from Stripe via /api/cron/sales-calls.
//   node scripts/backfill-sales-ghl.mjs            # DRY
//   node scripts/backfill-sales-ghl.mjs --apply
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const LOC = "Zyilin5HFiDuC461lVdk";
const PIPELINE = "wlbUxH9iNKjzI0PWCLO0"; // Sales Pipeline

const STAGE_BY_ID = {
  "df796d72-59ff-4f9e-b83c-29276a208cca": "lead",        // Lead
  "21f5a96f-7e38-4464-9d43-bbd61e085f91": "scheduled",   // Call Booked
  "cc222cc8-2670-4c81-91c7-ecb433e169f6": "no_show",     // Didn't Show
  "33c5d5e2-59b8-4548-9627-b5769297b93d": "showed_up",   // Showed
  "6b832398-20e3-4b03-9e41-5ab170aa995c": "showed_up",   // Follow Up
  "df1018cc-b05d-44a3-bb92-c9117073da07": "showed_up",   // Deposit Collected (Stripe decides won)
  "c1831f9c-975a-4d77-b7de-32150373c43f": "won",         // Won (Stripe cron confirms/reprices/reverts)
  "01697851-46d0-4d54-9e27-86c2f78f3ad0": "lost",        // Lost
};

const env = {};
for (const l of readFileSync("/Users/dusan/Tracking/.env.local", "utf8").split(/\r?\n/)) { const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim()); if (m) env[m[1]] = m[2]; }
const H = { Authorization: `Bearer ${env.GHL_TIBOR_TOKEN}`, Version: "2021-07-28", Accept: "application/json" };

// pull all opportunities in the pipeline (paginate)
const opps = [];
let url = `https://services.leadconnectorhq.com/opportunities/search?location_id=${LOC}&pipeline_id=${PIPELINE}&limit=100`;
for (let guard = 0; guard < 20 && url; guard++) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`GHL ${r.status}: ${await r.text()}`);
  const j = await r.json();
  opps.push(...(j.opportunities || []));
  url = j.meta && j.meta.nextPageUrl ? j.meta.nextPageUrl : null;
}
console.log("GHL Sales Pipeline opportunities:", opps.length);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: org } = await sb.from("organizations").select("id").eq("slug", "tibor").single();
const orgId = org.id;

const isTest = (o) => /test/i.test(`${o.name || ""} ${o.contact?.email || ""} ${o.contact?.name || ""}`);
const tally = {};
const rows = opps.filter((o) => !isTest(o)).map((o) => {
  const stage = STAGE_BY_ID[o.pipelineStageId] || "lead";
  tally[stage] = (tally[stage] || 0) + 1;
  const c = o.contact || {};
  return {
    org_id: orgId,
    external_id: o.id, // same key the live GHL webhook uses
    contact_name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || null,
    contact_email: (c.email || "").toLowerCase() || null,
    contact_phone: c.phone || null,
    package: null,
    amount: 0, // Stripe (sales-calls cron) is the source of truth for money
    currency: "EUR",
    stage,
    lost_reason: null,
    setter: null,
    closer: "Mlađan",
    source: o.source || "ghl",
    scheduled_at: o.createdAt || null,
    closed_at: stage === "won" ? o.lastStageChangeAt || o.updatedAt : null,
    raw_data: { stage_name: Object.keys(STAGE_BY_ID).includes(o.pipelineStageId) ? o.pipelineStageId : o.pipelineStageId, status: o.status, mv: o.monetaryValue },
  };
});
console.log("stage tally:", JSON.stringify(tally));

if (!APPLY) { console.log("\n(DRY — ništa upisano. --apply za backup+zamenu.)"); process.exit(0); }

const { data: old } = await sb.from("calls").select("*").eq("org_id", orgId);
if ((old?.length || 0) > 0) {
  const f = `/Users/dusan/Tracking/scripts/backup-calls-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(f, JSON.stringify(old, null, 2));
  console.log(`backup ${old.length} calls -> ${f}`);
}
const { error: delErr } = await sb.from("calls").delete().eq("org_id", orgId);
if (delErr) { console.error("delete:", delErr.message); process.exit(1); }
const { error: insErr } = await sb.from("calls").insert(rows);
if (insErr) { console.error("insert:", insErr.message); process.exit(1); }
console.log(`upisano ${rows.length} GHL calls.`);
process.exit(0);
