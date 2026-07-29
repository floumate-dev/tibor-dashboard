import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import SalesDashboard from "./SalesDashboard";
import { CallRow, DEMO_CALLS, EvergreenDay, Stage } from "./data";
import { pullEvergreenLive } from "../../lib/evergreen-ghl";
import "./dashboard.css";

export const dynamic = "force-dynamic";
// The evergreen view fans out ~80 GHL calls; give the serverless function room
// so a slow pull completes instead of timing out to an empty dashboard.
export const maxDuration = 60;

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

// Evergreen webinar metrics — pulled LIVE from GHL tags on load (no CSV, no
// storage; auto-discovers new webinar days incl. tomorrow's as its optins
// arrive). Cached ~60s so rapid re-opens don't re-hit GHL; each open past that
// re-pulls fresh. See src/lib/evergreen-ghl.ts.
const getEvergreenLive = unstable_cache(
  async (): Promise<EvergreenDay[]> => {
    const token = process.env.GHL_TIBOR_TOKEN;
    if (!token) return [];
    return pullEvergreenLive(token);
  },
  ["evergreen-live-v3"],
  { revalidate: 60 }
);

async function fetchEvergreen(): Promise<EvergreenDay[]> {
  try {
    return await getEvergreenLive();
  } catch {
    return [];
  }
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
  if (searchParams.demo === "1") {
    calls = DEMO_CALLS;
  } else {
    try {
      [calls, evergreen] = await Promise.all([fetchCalls(), fetchEvergreen()]);
    } catch {
      calls = [];
    }
  }
  return <SalesDashboard calls={calls} evergreen={evergreen} presetUser={searchParams.u} />;
}
