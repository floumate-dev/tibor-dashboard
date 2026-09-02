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
  let sales = charges.filter(isEvergreenSale);

  if (skipExisting && sales.length) {
    const { data: have } = await supabase
      .from("evergreen_sales")
      .select("stripe_id")
      .eq("org_id", orgId)
      .in("stripe_id", sales.map((c) => c.id));
    const seen = new Set((have || []).map((r) => r.stripe_id as string));
    sales = sales.filter((c) => !seen.has(c.id));
  }

  // Bounded concurrency: one GHL lookup per sale, rate-limit friendly.
  let ok = 0,
    failed = 0;
  const counts: Record<string, number> = { attended: 0, optin: 0, phone_optin: 0, purchase_time: 0, unmatched: 0 };
  let i = 0;
  const worker = async () => {
    while (i < sales.length) {
      const c: StripeCharge = sales[i++];
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

  return NextResponse.json({
    ok: true,
    window_since: new Date(sinceUnix * 1000).toISOString().slice(0, 10),
    charges_scanned: charges.length,
    evergreen_sales: sales.length,
    upserted: ok,
    failed,
    attribution: counts,
  });
}
