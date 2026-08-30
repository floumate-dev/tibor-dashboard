import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pullRecentIgMessages } from "@/lib/dm-instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// DM reconciliation safety-net: re-pull skorašnjih IG poruka i idempotentno
// dopuni dm_daily preko dm_apply_message (dedup po mid → već izbrojane se
// preskaču). Webhooks su primarni; ovo hvata propuštene.
//
// Auth: isti pattern kao evergreen cron (Bearer CRON_SECRET). Piše SAMO kad je
// DM_RECONCILE_WRITE=true — inače dry-run (vrati koliko bi primenio) dok se ne
// potvrdi na živim podacima da Graph `id` == webhook `mid`.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.IG_PAGE_TOKEN;
  const businessId = process.env.IG_BUSINESS_ID;
  if (!token || !businessId) {
    return NextResponse.json({ ok: true, skipped: "IG_PAGE_TOKEN/IG_BUSINESS_ID not configured" });
  }

  const supabase = serviceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "tibor")
    .single();
  if (!org) {
    return NextResponse.json({ error: "tibor org not found" }, { status: 404 });
  }

  let messages;
  try {
    messages = await pullRecentIgMessages(token, businessId);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const willWrite = process.env.DM_RECONCILE_WRITE === "true";
  if (!willWrite) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      pulled: messages.length,
      note: "Set DM_RECONCILE_WRITE=true to apply (idempotent by mid).",
    });
  }

  let applied = 0;
  for (const m of messages) {
    const { error } = await supabase.rpc("dm_apply_message", {
      p_org: org.id,
      p_mid: m.mid,
      p_thread: m.threadId,
      p_occurred: m.occurredAt,
      p_direction: m.direction,
      p_has_booking: m.hasBooking,
      p_has_payment: m.hasPayment,
      p_raw: {},
    });
    if (!error) applied++;
    else console.error("reconcile dm_apply_message:", error.message);
  }

  return NextResponse.json({ ok: true, pulled: messages.length, applied });
}
