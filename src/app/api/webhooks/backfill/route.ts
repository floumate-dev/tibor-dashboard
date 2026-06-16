import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseGhlCall } from "@/lib/webhooks/adapters/ghl";

export const dynamic = "force-dynamic";

// TEMPORARY one-off backfill: pulls real Sales Pipeline opportunities from GHL
// into the `calls` table (org tibor), deletes the fake seed rows first. Reuses
// parseGhlCall so mapping matches the live webhook exactly. Secret-guarded,
// lives under /api/webhooks (auth-exempt). DELETE after running.

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION = "Zyilin5HFiDuC461lVdk";
const PIPELINE = "wlbUxH9iNKjzI0PWCLO0";
const PAKET_FIELD = "VFGdoIHlbJPIHYVToOlV";
const PRODUKT_FIELD = "gMSwAhXVx19KCJ94fniD";

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
  };
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("s") !== "tbr-diag-9f3a") {
    return NextResponse.json({ error: "nope" }, { status: 403 });
  }
  const token = process.env.GHL_TIBOR_TOKEN;
  if (!token) return NextResponse.json({ error: "no GHL token" }, { status: 500 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (i: RequestInfo | URL, init?: RequestInit) => fetch(i, { ...init, cache: "no-store" }) } }
  );

  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return NextResponse.json({ error: "no org" }, { status: 404 });

  // 1) stage id -> name map
  const pipeRes = await fetch(`${GHL_BASE}/opportunities/pipelines?locationId=${LOCATION}`, {
    headers: ghlHeaders(token),
    cache: "no-store",
  });
  const pipeJson = await pipeRes.json();
  const pipeline = (pipeJson.pipelines || []).find((p: { id: string }) => p.id === PIPELINE);
  const stageName: Record<string, string> = {};
  for (const s of pipeline?.stages || []) stageName[s.id] = s.name;

  // 2) fetch all opportunities in the Sales Pipeline (paginate)
  const opps: Record<string, unknown>[] = [];
  let url: string | null =
    `${GHL_BASE}/opportunities/search?location_id=${LOCATION}&pipeline_id=${PIPELINE}&limit=100`;
  while (url) {
    const r: Response = await fetch(url, { headers: ghlHeaders(token), cache: "no-store" });
    if (!r.ok) return NextResponse.json({ error: `GHL ${r.status}` }, { status: 502 });
    const j= await r.json();
    opps.push(...(j.opportunities || []));
    url = j.meta?.nextPageUrl || null;
  }

  // 3) delete fake seed rows
  const { error: delErr } = await supabase
    .from("calls")
    .delete()
    .eq("org_id", org.id)
    .like("external_id", "seedtest_%");

  // 4) map + upsert each opportunity (reuse parseGhlCall via synthetic payload)
  const results: { name: string; stage: string; pkg: string | null; amount: number }[] = [];
  for (const o of opps) {
    const cf = (o.customFields as { id: string; fieldValueString?: string; fieldValue?: string }[]) || [];
    const cfVal = (id: string) => {
      const f = cf.find((x) => x.id === id);
      return f?.fieldValueString ?? f?.fieldValue ?? "";
    };
    const contact = (o.contact as { name?: string; phone?: string; email?: string }) || {};
    const rel = (((o.relations as { email?: string; phone?: string; fullName?: string; contactName?: string }[]) || [])[0]) || {};
    const body = {
      opportunity_id: o.id,
      full_name: contact.name || rel.fullName || rel.contactName || o.name,
      phone: contact.phone || rel.phone || "",
      email: contact.email || rel.email || "",
      stage: stageName[o.pipelineStageId as string] || "",
      produkt: cfVal(PRODUKT_FIELD),
      paket: cfVal(PAKET_FIELD),
      amount: o.monetaryValue ?? 0,
      // Realni datumi: kad je opportunity nastao / poslednja promena.
      scheduled_at: o.createdAt,
      updated_at: o.lastStatusChangeAt || o.updatedAt,
    };
    const parsed = parseGhlCall(body as Record<string, unknown>);
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
    await supabase.from("calls").upsert(row, { onConflict: "org_id,external_id" });
    results.push({ name: parsed.contact_name || "?", stage: parsed.stage, pkg: parsed.package, amount: parsed.amount });
  }

  return NextResponse.json({
    deletedSeed: !delErr,
    imported: results.length,
    rows: results,
  });
}
