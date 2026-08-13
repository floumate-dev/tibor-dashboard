import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pullEvergreenLive } from "@/lib/evergreen-ghl";

export const dynamic = "force-dynamic";
// The pull fans out ~6 GHL calls per webinar day; give it plenty of room. This
// runs on a Vercel Cron (see vercel.json), OFF the user path — its runtime never
// affects dashboard load speed.
export const maxDuration = 300;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Refresh the `evergreen_webinars` store from live GHL tags. The dashboard reads
// this store (fast, single query) instead of pulling GHL on load. Vercel Cron
// sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set; we also
// allow a manual trigger with the same header.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.GHL_TIBOR_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GHL token not configured" }, { status: 500 });
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

  const days = await pullEvergreenLive(token);
  const now = new Date().toISOString();
  const rows = days.map((d) => ({
    org_id: org.id,
    webinar_date: d.date,
    registrants: d.registrants,
    attendees: d.attendees,
    seg_no_show: d.noShow,
    seg_before_pitch: d.beforePitch,
    seg_reached_pitch: d.reachedPitch,
    seg_full_pitch: d.fullPitch,
    conversions: d.conversions,
    recording_label: d.recording || null,
    updated_at: now,
  }));

  if (rows.length) {
    const { error } = await supabase
      .from("evergreen_webinars")
      .upsert(rows, { onConflict: "org_id,webinar_date" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, days: rows.length, refreshedAt: now });
}
