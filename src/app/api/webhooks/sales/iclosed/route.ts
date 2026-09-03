import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live iClosed feed for the SALES department (Mlađan / "Korak Ispred" strategy
// calls). iClosed webhooks are account-wide, so we only record calls owned by
// the sales closer here — burno's DM calls stay in the DM department. Money is
// NOT set here: closes + revenue come from Stripe via /api/cron/sales-calls,
// which flips a booked call to "won" once a high-ticket payment matches it.
//
// One row per CONTACT (external_id = iclosed:<email|phone>), matching the
// backfill convention so live events update the same row instead of duplicating.

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function verify(request: NextRequest): boolean {
  const secret = process.env.ICLOSED_SALES_WEBHOOK_SECRET;
  if (!secret) return true; // not set yet -> accept (set it once configured)
  const h = request.headers.get("x-webhook-secret");
  const q = new URL(request.url).searchParams.get("secret");
  return h === secret || q === secret;
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}
const norm9 = (p: string) => (p || "").replace(/[^0-9]/g, "").slice(-9);

// Map an iClosed status/event string to our call stage. Defensive: iClosed
// payloads vary, so match on keywords. Unknown -> "scheduled" (a booking).
function toStage(s: string): "scheduled" | "showed_up" | "no_show" | "lost" | null {
  const t = s.toLowerCase();
  if (/cancel/.test(t)) return "lost";
  if (/no[\s_-]?show|didn'?t\s?show|absent/.test(t)) return "no_show";
  if (/show(ed)?|attend|complete|held|done|qualified/.test(t)) return "showed_up";
  if (/book|schedul|created|new|potential|reschedul/.test(t)) return "scheduled";
  return null;
}

export async function POST(request: NextRequest) {
  if (!verify(request)) return NextResponse.json({ error: "bad secret" }, { status: 401 });
  const raw = await request.text();
  let body: Record<string, unknown>;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const nested =
    (body.booking as Record<string, unknown>) ||
    (body.appointment as Record<string, unknown>) ||
    (body.contact as Record<string, unknown>) ||
    (body.data as Record<string, unknown>) ||
    {};
  const src = { ...nested, ...body };

  // Only the sales closer's calls belong here (skip burno / DM).
  const owner = pick(src, "closer", "closer_owner", "closerOwner", "owner", "owner_name", "assigned_to", "assignedTo", "current_closer_owner");
  if (owner && !/korak\s*ispred|mla[dđ]jan/i.test(owner)) {
    return NextResponse.json({ ok: true, skipped: "not sales owner", owner });
  }

  const email = pick(src, "email", "contact_email", "contactEmail").toLowerCase();
  const phone = pick(src, "phone", "phone_number", "phoneNumber", "contact_phone");
  const p9 = norm9(phone);
  if (!email && !p9) return NextResponse.json({ ok: true, skipped: "no contact key" });

  const first = pick(src, "first_name", "firstName", "first");
  const last = pick(src, "last_name", "lastName", "last");
  const name = `${first} ${last}`.trim() || pick(src, "name", "full_name", "contact_name") || null;
  const statusStr = pick(src, "status", "disposition", "outcome", "event", "type", "event_type", "eventType", "scheduling_status", "last_interaction_type");
  const stage = toStage(statusStr);
  const when = pick(src, "scheduled_at", "start_time", "startTime", "start", "created_at", "createdAt") || new Date().toISOString();
  const source = pick(src, "utm_source", "source", "utmSource") || "iclosed";

  const supabase = serviceClient();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return NextResponse.json({ error: "org not found" }, { status: 404 });
  const orgId = org.id as string;
  const externalId = "iclosed:" + (email || p9);

  // Never downgrade a won (Stripe owns that) or clobber it with a booking event.
  const { data: existing } = await supabase
    .from("calls")
    .select("id, stage, amount")
    .eq("org_id", orgId)
    .eq("external_id", externalId)
    .maybeSingle();
  const keepWon = existing?.stage === "won";

  const row: Record<string, unknown> = {
    org_id: orgId,
    external_id: externalId,
    contact_name: name,
    contact_email: email || null,
    contact_phone: phone || null,
    closer: "Mlađan",
    source,
    stage: keepWon ? "won" : (stage || existing?.stage || "scheduled"),
    scheduled_at: when,
    lost_reason: stage === "lost" ? "Otkazan poziv" : null,
    raw_data: body,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("calls").upsert(row, { onConflict: "org_id,external_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, external_id: externalId, stage: row.stage, status: statusStr });
}
