import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  getCharge,
  resolveSessionCharge,
  isEvergreenSale,
  attributeSale,
  upsertSale,
  chargeEmail,
  chargePhone,
  type StripeCharge,
} from "@/lib/evergreen-sales";

// Node runtime: crypto for Stripe signature verification (Edge has no Node crypto).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function timingSafeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Verify the Stripe-Signature header against the endpoint's signing secret.
function verifyStripe(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_EVERGREEN_WEBHOOK_SECRET;
  if (!secret) return false; // fail closed: never accept unverified events in prod
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string])
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const hmac = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest("hex");
  return timingSafeEq(v1, hmac);
}

// Live evergreen sales capture. Stripe -> this endpoint -> evergreen_sales; the
// DB trigger then keeps evergreen_webinars.conversions in sync. The reconcile
// cron (/api/cron/sales) is the safety net for anything missed here.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyStripe(rawBody, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_TIBOR_KEY;
  const ghlToken = process.env.GHL_TIBOR_TOKEN;
  if (!stripeKey || !ghlToken) {
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const supabase = serviceClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return NextResponse.json({ error: "org not found" }, { status: 404 });
  const orgId = org.id as string;

  const obj = event.data?.object || {};

  // Resolve to a Stripe charge, whatever the event.
  let charge: StripeCharge | null = null;
  if (event.type === "checkout.session.completed") {
    if (obj.payment_status && obj.payment_status !== "paid") {
      return NextResponse.json({ ok: true, ignored: "not paid" });
    }
    charge = await resolveSessionCharge(stripeKey, obj);
  } else if (event.type === "charge.refunded") {
    charge = (obj as unknown as StripeCharge)?.id
      ? await getCharge(stripeKey, obj.id as string)
      : null;
  } else {
    return NextResponse.json({ ok: true, ignored: event.type || "" });
  }

  // Couldn't resolve, or not an evergreen product -> ack; cron will reconcile.
  if (!charge) return NextResponse.json({ ok: true, unresolved: true });
  if (!isEvergreenSale(charge)) return NextResponse.json({ ok: true, skipped: "not evergreen" });

  // A refund of an already-captured sale must NOT re-run attribution — that
  // would clobber a good day (e.g. one recovered from Hyros) with a weaker
  // guess. Just flip the refunded flag; the trigger drops it from conversions.
  if (event.type === "charge.refunded") {
    const { data: existing } = await supabase
      .from("evergreen_sales")
      .select("stripe_id")
      .eq("org_id", orgId)
      .eq("stripe_id", charge.id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("evergreen_sales")
        .update({ refunded: charge.refunded || charge.amount_refunded > 0, updated_at: new Date().toISOString() })
        .eq("org_id", orgId)
        .eq("stripe_id", charge.id);
      return NextResponse.json({ ok: true, type: event.type, stripe_id: charge.id, refunded: true });
    }
    // else: fall through to attribute + insert (a refund for a sale we missed).
  }

  const attr = await attributeSale(
    supabase,
    ghlToken,
    orgId,
    chargeEmail(charge),
    chargePhone(charge),
    new Date(charge.created * 1000).toISOString()
  );
  const { error } = await upsertSale(supabase, orgId, charge, attr);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({
    ok: true,
    type: event.type,
    stripe_id: charge.id,
    webinar_date: attr.webinar_date,
    attribution: attr.attribution,
    refunded: charge.refunded || charge.amount_refunded > 0,
  });
}
