import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseGenericLead, parseGenericPurchase } from "@/lib/webhooks/adapters/generic";
import { parseGhlCall } from "@/lib/webhooks/adapters/ghl";

// Use service role key for webhook inserts (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string; orgSlug: string } }
) {
  const { platform, orgSlug } = params;
  const supabase = getServiceClient();

  // Find the organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // GHL sales pipeline → calls. Same opportunity arrives multiple times as it
  // moves through stages, so upsert on (org_id, external_id).
  if (platform === "ghl") {
    const parsed = parseGhlCall(body);
    const row = {
      org_id: org.id,
      external_id: parsed.external_id,
      contact_name: parsed.contact_name,
      contact_email: parsed.contact_email,
      contact_phone: parsed.contact_phone,
      package: parsed.package,
      amount: parsed.amount,
      currency: parsed.currency,
      stage: parsed.stage,
      lost_reason: parsed.lost_reason,
      setter: parsed.setter,
      closer: parsed.closer,
      source: parsed.source,
      scheduled_at: parsed.scheduled_at,
      closed_at: parsed.closed_at,
      raw_data: parsed.raw_data,
    };

    const { error } = parsed.external_id
      ? await supabase
          .from("calls")
          .upsert(row, { onConflict: "org_id,external_id" })
      : await supabase.from("calls").insert(row);

    if (error) {
      console.error("Failed to save call:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, type: "call", stage: parsed.stage });
  }

  // Determine if this is a lead or purchase based on platform
  const isPurchase =
    platform === "stripe" ||
    platform === "woocommerce" ||
    platform === "generic-purchase";

  if (isPurchase) {
    const parsed = parseGenericPurchase(body);
    const { error } = await supabase.from("purchases").insert({
      org_id: org.id,
      source: parsed.source,
      medium: parsed.medium,
      campaign: parsed.campaign,
      amount: parsed.amount,
      currency: parsed.currency,
      email: parsed.email,
      raw_data: parsed.raw_data,
    });

    if (error) {
      console.error("Failed to insert purchase:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, type: "purchase" });
  }

  // Default: treat as lead
  const parsed = parseGenericLead(body);
  const { error } = await supabase.from("leads").insert({
    org_id: org.id,
    source: parsed.source,
    medium: parsed.medium,
    campaign: parsed.campaign,
    email: parsed.email,
    raw_data: parsed.raw_data,
  });

  if (error) {
    console.error("Failed to insert lead:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type: "lead" });
}
