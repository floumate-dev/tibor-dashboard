import { createClient } from "@supabase/supabase-js";
import SalesDashboard from "./SalesDashboard";
import { CallRow, DEMO_CALLS, Stage } from "./data";
import "./dashboard.css";

export const dynamic = "force-dynamic";

async function fetchCalls(): Promise<CallRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  // force-dynamic alone doesn't reliably bypass Next's fetch cache for the
  // supabase-js client, so calls can go stale after a webhook fires. Inject a
  // no-store fetch so every page load reads fresh data from the DB.
  const supabase = createClient(url, key, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
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
  if (searchParams.demo === "1") {
    calls = DEMO_CALLS;
  } else {
    try {
      calls = await fetchCalls();
    } catch {
      calls = [];
    }
  }
  return <SalesDashboard calls={calls} presetUser={searchParams.u} />;
}
