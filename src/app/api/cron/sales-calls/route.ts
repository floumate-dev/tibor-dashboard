import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listCharges } from "@/lib/evergreen-sales";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

// Sales closes = Stripe (source of truth for money). A high-ticket "Korak Ispred"
// payment (>= €200, not the €97.99/47 evergreen product) flips a BOOKED iClosed
// call to "won", per Tibor's rule: it only counts as Mlađan's close if that
// buyer already has a booked call. Revenue = sum of the buyer's high-ticket
// charges (installments included, refunds excluded). Idempotent: recomputed each
// run, so refunds lower the amount and a fully-refunded close reverts.
const HIGH_TICKET_CENTS = 20000;
const START = "2026-06-01"; // pull full high-ticket history (low volume, cheap)

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
const norm9 = (p: string) => (p || "").replace(/[^0-9]/g, "").slice(-9);

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stripeKey = process.env.STRIPE_TIBOR_KEY;
  if (!stripeKey) return NextResponse.json({ error: "STRIPE_TIBOR_KEY not configured" }, { status: 500 });

  const supabase = serviceClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return NextResponse.json({ error: "tibor org not found" }, { status: 404 });
  const orgId = org.id as string;

  // High-ticket buyers from Stripe (net collected).
  const since = Math.floor(new Date(START + "T00:00:00Z").getTime() / 1000);
  const charges = (await listCharges(stripeKey, since)).filter(
    (c) => c.paid && c.currency === "eur" && c.amount >= HIGH_TICKET_CENTS
  );
  const buyers = new Map<string, { net: number; last: string; name: string | null }>();
  for (const c of charges) {
    const e = (c.billing_details?.email || "").trim().toLowerCase();
    if (!e) continue;
    const b = buyers.get(e) || { net: 0, last: "", name: c.billing_details?.name || null };
    if (!(c.refunded || c.amount_refunded > 0)) b.net += c.amount / 100;
    const d = new Date(c.created * 1000).toISOString();
    if (d > b.last) b.last = d;
    buyers.set(e, b);
  }

  // All booked (non-lead) calls, indexed by email + phone.
  const { data: calls } = await supabase
    .from("calls")
    .select("id, external_id, contact_email, contact_phone, stage")
    .eq("org_id", orgId)
    .neq("stage", "lead");
  const byEmail = new Map<string, { id: string; stage: string }>();
  const byPhone = new Map<string, { id: string; stage: string }>();
  for (const c of calls || []) {
    const rec = { id: c.id as string, stage: c.stage as string };
    if (c.contact_email) byEmail.set((c.contact_email as string).toLowerCase(), rec);
    const p = norm9((c.contact_phone as string) || "");
    if (p.length >= 8) byPhone.set(p, rec);
  }

  // Mlađan closes ALL high-ticket (burno only sets), so every high-ticket buyer
  // is a won: update their booked call if one exists, else create a won row
  // (external_id "stripe:<email>"). Idempotent.
  const now = new Date().toISOString();
  const buyerEmails = new Set<string>();
  let wonFromBooked = 0,
    wonCreated = 0;
  for (const [email, b] of Array.from(buyers.entries())) {
    if (b.net <= 0) continue;
    buyerEmails.add(email);
    const hit = byEmail.get(email);
    if (hit) {
      await supabase
        .from("calls")
        .update({ stage: "won", package: "Korak Ispred", amount: b.net, currency: "EUR", closed_at: b.last, updated_at: now })
        .eq("org_id", orgId)
        .eq("id", hit.id);
      wonFromBooked++;
    } else {
      await supabase.from("calls").upsert(
        {
          org_id: orgId,
          external_id: "stripe:" + email,
          contact_name: b.name,
          contact_email: email,
          package: "Korak Ispred",
          amount: b.net,
          currency: "EUR",
          stage: "won",
          closer: "Mlađan",
          source: "stripe",
          scheduled_at: b.last,
          closed_at: b.last,
          updated_at: now,
        },
        { onConflict: "org_id,external_id" }
      );
      wonCreated++;
    }
  }

  // Revert stale wins: a booked (GHL) call whose buyer refunded to €0 -> showed_up.
  let reverted = 0;
  for (const c of calls || []) {
    const ext = String(c.external_id || "");
    if (c.stage === "won" && !ext.startsWith("stripe:") && !buyerEmails.has((c.contact_email as string || "").toLowerCase())) {
      await supabase.from("calls").update({ stage: "showed_up", amount: 0, package: null, updated_at: now }).eq("org_id", orgId).eq("id", c.id);
      reverted++;
    }
  }
  // Delete stripe-origin won rows whose buyer is no longer a high-ticket buyer.
  let deleted = 0;
  const { data: stripeRows } = await supabase
    .from("calls")
    .select("id, contact_email")
    .eq("org_id", orgId)
    .like("external_id", "stripe:%");
  for (const r of stripeRows || []) {
    if (!buyerEmails.has((r.contact_email as string || "").toLowerCase())) {
      await supabase.from("calls").delete().eq("org_id", orgId).eq("id", r.id);
      deleted++;
    }
  }

  const highTicketTotal = Array.from(buyers.values()).reduce((s, b) => s + b.net, 0);
  return NextResponse.json({
    ok: true,
    high_ticket_buyers: buyers.size,
    high_ticket_total: highTicketTotal,
    won_from_booked: wonFromBooked,
    won_created: wonCreated,
    reverted,
    deleted,
  });
}
