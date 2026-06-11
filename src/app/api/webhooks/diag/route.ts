import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic endpoint — returns raw_data of recent tibor calls so we
// can see exactly which keys the GHL workflow webhook delivered. Secret-guarded.
// Lives under /api/webhooks so middleware leaves it un-gated. DELETE after use.
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("s");
  if (secret !== "tbr-diag-9f3a") {
    return NextResponse.json({ error: "nope" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "tibor")
    .single();
  if (!org) return NextResponse.json({ error: "no org" }, { status: 404 });

  const { data, error } = await supabase
    .from("calls")
    .select("id, contact_name, stage, package, amount, external_id, created_at, raw_data")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0, rows: data });
}
