import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  listCharges,
  isEvergreenSale,
  attributeSale,
  upsertSale,
  chargeEmail,
  chargePhone,
  type StripeCharge,
} from "@/lib/evergreen-sales";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Backfill can page through months of Stripe + one GHL lookup per buyer; give it
// room. Runs off the user path (cron / manual), never affects dashboard load.
export const maxDuration = 300;

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Reconcile evergreen_sales against Stripe (source of truth) for a time window.
//   default              -> last 3 days (safety net behind the live webhook)
//   ?since=2026-06-30    -> full backfill from launch
//   ?days=14             -> last N days
//   ?skipExisting=1      -> don't re-check charges already stored (resumable backfill)
// The DB trigger recomputes each day's conversions from what we upsert here.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stripeKey = process.env.STRIPE_TIBOR_KEY;
  const ghlToken = process.env.GHL_TIBOR_TOKEN;
  if (!stripeKey || !ghlToken) {
    return NextResponse.json({ error: "STRIPE_TIBOR_KEY / GHL_TIBOR_TOKEN not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const days = Number(url.searchParams.get("days") || 3);
  const skipExisting = url.searchParams.get("skipExisting") === "1";
  const sinceUnix = since
    ? Math.floor(new Date(since + "T00:00:00Z").getTime() / 1000)
    : Math.floor(Date.now() / 1000) - days * 86400;

  const supabase = serviceClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return NextResponse.json({ error: "tibor org not found" }, { status: 404 });
  const orgId = org.id as string;

  const charges = await listCharges(stripeKey, sinceUnix);
  const sales = charges.filter(isEvergreenSale);

  // Which of these are already stored? Reconcile must NOT re-attribute an
  // existing sale — attribution can only improve with extra data (e.g. Hyros
  // phones), and re-running with Stripe-only data would DOWNGRADE a recovered
  // day back to a purchase-time guess. So: existing rows get only a refund-state
  // refresh; new (missed) sales get the full attribute + insert.
  const idList = sales.map((c) => c.id);
  const existing = new Map<string, boolean>();
  if (idList.length) {
    const { data: have } = await supabase
      .from("evergreen_sales")
      .select("stripe_id, refunded")
      .eq("org_id", orgId)
      .in("stripe_id", idList);
    for (const r of have || []) existing.set(r.stripe_id as string, r.refunded as boolean);
  }
  const newSales = sales.filter((c) => !existing.has(c.id));

  // Refund-state sync for existing rows (cheap, no GHL).
  let refundSynced = 0;
  for (const c of sales) {
    if (!existing.has(c.id)) continue;
    const nowRefunded = c.refunded || c.amount_refunded > 0;
    if (nowRefunded !== existing.get(c.id)) {
      await supabase
        .from("evergreen_sales")
        .update({ refunded: nowRefunded, updated_at: new Date().toISOString() })
        .eq("org_id", orgId)
        .eq("stripe_id", c.id);
      refundSynced++;
    }
  }

  // Bounded concurrency: one GHL lookup per NEW sale, rate-limit friendly.
  let ok = 0,
    failed = 0;
  const counts: Record<string, number> = { attended: 0, optin: 0, phone_optin: 0, purchase_time: 0, unmatched: 0 };
  let i = 0;
  const worker = async () => {
    while (i < newSales.length) {
      const c: StripeCharge = newSales[i++];
      try {
        const attr = await attributeSale(
          supabase,
          ghlToken,
          orgId,
          chargeEmail(c),
          chargePhone(c),
          new Date(c.created * 1000).toISOString()
        );
        const { error } = await upsertSale(supabase, orgId, c, attr);
        if (error) failed++;
        else {
          ok++;
          counts[attr.attribution]++;
        }
      } catch {
        failed++;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
  };
  await Promise.all([worker(), worker()]);

  // `skipExisting` retained for API compatibility; existing rows are already
  // never re-attributed above, so it's a no-op now.
  void skipExisting;

  return NextResponse.json({
    ok: true,
    window_since: new Date(sinceUnix * 1000).toISOString().slice(0, 10),
    charges_scanned: charges.length,
    evergreen_sales: sales.length,
    new_attributed: ok,
    refund_synced: refundSynced,
    failed,
    attribution: counts,
  });
}
