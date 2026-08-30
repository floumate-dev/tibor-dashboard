import { createClient } from "@supabase/supabase-js";
import SalesDashboard from "./SalesDashboard";
import { CallRow, DEMO_CALLS, DEMO_DM, DmDay, EvergreenDay, Stage } from "./data";
import "./dashboard.css";

export const dynamic = "force-dynamic";

// Shared supabase client (service role, no-store so data is fresh each load).
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

// Webinar (20:00 Europe/Belgrade = 18:00 UTC) already started? Before it starts,
// attendance is N/A (the UI shows "predstoji"). Derived at read time.
function evgOccurred(dateISO: string): boolean {
  return Date.now() >= new Date(dateISO + "T18:00:00Z").getTime();
}

// Evergreen webinar metrics — read from the precomputed `evergreen_webinars`
// store, kept fresh by the /api/cron/evergreen cron (GHL pull off the user path).
// One fast query; no live GHL fan-out on load. See src/lib/evergreen-ghl.ts for
// the pull the cron runs.
async function fetchEvergreen(): Promise<EvergreenDay[]> {
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return [];
  const { data, error } = await supabase
    .from("evergreen_webinars")
    .select("webinar_date, registrants, attendees, seg_no_show, seg_before_pitch, seg_reached_pitch, seg_full_pitch, conversions, recording_label")
    .eq("org_id", org.id)
    .order("webinar_date", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    date: r.webinar_date as string,
    registrants: Number(r.registrants) || 0,
    attendees: Number(r.attendees) || 0,
    noShow: Number(r.seg_no_show) || 0,
    beforePitch: Number(r.seg_before_pitch) || 0,
    reachedPitch: Number(r.seg_reached_pitch) || 0,
    fullPitch: Number(r.seg_full_pitch) || 0,
    conversions: Number(r.conversions) || 0,
    recording: (r.recording_label as string) || "",
    occurred: evgOccurred(r.webinar_date as string),
  }));
}

// DM department (Instagram DM funnel) — čita precomputed `dm_daily` store, koji
// webhook rute (instagram/iclosed/stripe) održavaju svežim. Jedan brz query.
async function fetchDmDaily(): Promise<DmDay[]> {
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return [];
  const { data, error } = await supabase
    .from("dm_daily")
    .select("day, outbound, inbound, conversations, booking_links, payment_links, appointments, purchases, revenue")
    .eq("org_id", org.id)
    .order("day", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    date: r.day as string,
    outbound: Number(r.outbound) || 0,
    inbound: Number(r.inbound) || 0,
    conversations: Number(r.conversations) || 0,
    bookingLinks: Number(r.booking_links) || 0,
    paymentLinks: Number(r.payment_links) || 0,
    appointments: Number(r.appointments) || 0,
    purchases: Number(r.purchases) || 0,
    revenue: Number(r.revenue) || 0,
  }));
}

async function fetchCalls(): Promise<CallRow[]> {
  // force-dynamic alone doesn't reliably bypass Next's fetch cache for the
  // supabase-js client, so calls can go stale after a webhook fires. The shared
  // client injects a no-store fetch so every page load reads fresh data.
  const supabase = serviceClient();
  if (!supabase) return [];
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", "tibor").single();
  if (!org) return [];

  const { data, error } = await supabase
    .from("calls")
    .select("id, contact_name, contact_phone, package, amount, currency, stage, lost_reason, scheduled_at, created_at")
    .eq("org_id", org.id)
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .limit(2000);

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    contact_name: (r.contact_name as string) ?? null,
    contact_phone: (r.contact_phone as string) ?? null,
    package: (r.package as string) ?? null,
    amount: Number(r.amount) || 0,
    currency: (r.currency as string) || "EUR",
    stage: (r.stage as Stage) ?? "scheduled",
    lost_reason: (r.lost_reason as string) ?? null,
    date: (r.scheduled_at as string) || (r.created_at as string),
  }));
}

export default async function TiborSalesPage({
  searchParams,
}: {
  searchParams: { demo?: string; u?: string };
}) {
  let calls: CallRow[];
  let evergreen: EvergreenDay[] = [];
  let dmDaily: DmDay[] = [];
  if (searchParams.demo === "1") {
    calls = DEMO_CALLS;
    dmDaily = DEMO_DM;
  } else {
    try {
      [calls, evergreen, dmDaily] = await Promise.all([fetchCalls(), fetchEvergreen(), fetchDmDaily()]);
    } catch {
      calls = [];
    }
  }
  return <SalesDashboard calls={calls} evergreen={evergreen} dmDaily={dmDaily} presetUser={searchParams.u} />;
}
