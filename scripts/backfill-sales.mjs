// One-time backfill of evergreen_sales from LIVE Stripe (source of truth),
// using the exact same lib as the webhook + reconcile cron (no logic drift).
// Attributes each initial Editunovac sale to a webinar day (last-touch via GHL).
//   node scripts/backfill-sales.mjs            # DRY: compute + compare, write nothing
//   node scripts/backfill-sales.mjs --apply    # upsert into evergreen_sales
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  listCharges, isEvergreenSale, attributeSale, upsertSale, chargeEmail, chargePhone, webinarDayFromPurchase,
} from "../src/lib/evergreen-sales.ts";

const APPLY = process.argv.includes("--apply");
const SINCE = "2026-06-30";

const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim());
  if (m) env[m[1]] = m[2];
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: org } = await sb.from("organizations").select("id").eq("slug", "tibor").single();
const orgId = org.id;

// snapshot current stored conversions (the OLD bought_eun-based numbers)
const { data: store } = await sb.from("evergreen_webinars").select("webinar_date, conversions").eq("org_id", orgId).order("webinar_date");
const oldByDay = Object.fromEntries(store.map((r) => [r.webinar_date, r.conversions || 0]));

const sinceUnix = Math.floor(new Date(SINCE + "T00:00:00Z").getTime() / 1000);
console.log("Pulling Stripe charges since", SINCE, "...");
const charges = await listCharges(env.STRIPE_TIBOR_KEY, sinceUnix);
const sales = charges.filter(isEvergreenSale);
console.log(`charges scanned: ${charges.length} | evergreen initial sales: ${sales.length}`);

const perDay = {};
const counts = { attended: 0, optin: 0, phone_optin: 0, purchase_time: 0, unmatched: 0 };
let done = 0, failed = 0, i = 0;
let agree = 0, disagree = 0; // purchase-time vs GHL-optin day, on the matched set
const worker = async () => {
  while (i < sales.length) {
    const c = sales[i++];
    try {
      const paidISO = new Date(c.created * 1000).toISOString();
      const attr = await attributeSale(sb, env.GHL_TIBOR_TOKEN, orgId, chargeEmail(c), chargePhone(c), paidISO);
      counts[attr.attribution]++;
      if (attr.webinar_date) perDay[attr.webinar_date] = (perDay[attr.webinar_date] || 0) + 1;
      // validate the purchase-time heuristic against days we DID match via GHL
      if (attr.attribution === "optin" || attr.attribution === "attended") {
        if (webinarDayFromPurchase(paidISO) === attr.webinar_date) agree++; else disagree++;
      }
      if (APPLY) { const { error } = await upsertSale(sb, orgId, c, attr); if (error) failed++; }
      done++;
      if (done % 25 === 0) console.log(`  ...${done}/${sales.length}`);
    } catch (e) { failed++; }
    await new Promise((r) => setTimeout(r, 120));
  }
};
await Promise.all([worker(), worker()]);

const newTot = Object.values(perDay).reduce((a, b) => a + b, 0);
const oldTot = Object.values(oldByDay).reduce((a, b) => a + b, 0);
const agRate = agree + disagree ? ((100 * agree) / (agree + disagree)).toFixed(1) : "n/a";
console.log(`\nPurchase-time vs GHL-optin day agreement (matched set): ${agree}/${agree + disagree} = ${agRate}%`);
console.log(`Attribution: attended ${counts.attended} | optin ${counts.optin} | phone ${counts.phone_optin} | purchase_time ${counts.purchase_time} | UNMATCHED ${counts.unmatched} | failed ${failed}`);
console.log(`Total conversions: OLD(bought_eun) ${oldTot} -> NEW(Stripe attributed) ${newTot}  (+ ${counts.unmatched} unattributed = ${newTot + counts.unmatched} total Stripe sales)`);
console.log("\nPer-day change (old -> new):");
const days = [...new Set([...Object.keys(oldByDay), ...Object.keys(perDay)])].sort();
for (const d of days) { const o = oldByDay[d] || 0, n = perDay[d] || 0; if (o !== n) console.log(`  ${d}: ${o} -> ${n}`); }
console.log(APPLY ? "\nAPPLIED (evergreen_sales upserted; trigger synced conversions)." : "\n(DRY — nothing written. Run with --apply.)");
process.exit(0);
