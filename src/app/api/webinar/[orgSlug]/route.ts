import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Webinar funnel dashboard — reads live tag counts from GHL (no storage).
// GHL tags follow the pattern `webinar_<DD_MM_YY>_<stage>`, e.g.
//   webinar_17_06_26_optin            → registered (prijava)
//   webinar_17_06_26_optin_meta       → source = meta
//   webinar_17_06_26_optin_referral   → source = referral
//   webinar_17_06_26_application      → filled application
// We count contacts per tag via GHL contact-search (`meta.total`).

const GHL_BASE = "https://services.leadconnectorhq.com";
const FALLBACK_WEBINAR = "17_06_26";
// Tiborov GHL location (isti kao u sales webhook-u).
const FALLBACK_LOCATION = "Zyilin5HFiDuC461lVdk";

// Human labels for known optin sources; unknown ones get title-cased.
const SOURCE_LABELS: Record<string, string> = {
  meta: "Meta",
  referral: "Referral",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google",
  youtube: "YouTube",
  organic: "Organski",
  direct: "Direktno",
};

function sourceLabel(key: string): string {
  return SOURCE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// Count contacts carrying a given tag.
async function countTag(
  token: string,
  locationId: string,
  tag: string
): Promise<number> {
  const res = await fetch(`${GHL_BASE}/contacts/search`, {
    method: "POST",
    headers: ghlHeaders(token),
    cache: "no-store",
    body: JSON.stringify({
      locationId,
      pageLimit: 1,
      filters: [{ field: "tags", operator: "contains", value: tag }],
    }),
  });
  if (!res.ok) throw new Error(`GHL search ${res.status}`);
  const data = await res.json();
  return Number(data?.total) || 0;
}

// Fetch a sample of contacts carrying a tag (used to discover which sources
// exist for a webinar). Returns the search total too, so the caller gets the
// optin count for free.
async function sampleTag(
  token: string,
  locationId: string,
  tag: string,
  limit = 100
): Promise<{ total: number; contacts: { tags?: string[] }[] }> {
  const res = await fetch(`${GHL_BASE}/contacts/search`, {
    method: "POST",
    headers: ghlHeaders(token),
    cache: "no-store",
    body: JSON.stringify({
      locationId,
      pageLimit: limit,
      filters: [{ field: "tags", operator: "contains", value: tag }],
    }),
  });
  if (!res.ok) throw new Error(`GHL search ${res.status}`);
  const data = await res.json();
  return { total: Number(data?.total) || 0, contacts: data?.contacts || [] };
}

// Detect the currently-active webinar by looking at the most recent contacts
// and taking the most common `webinar_<date>_optin` slug among them.
async function detectWebinar(
  token: string,
  locationId: string
): Promise<string | null> {
  const res = await fetch(
    `${GHL_BASE}/contacts/?locationId=${locationId}&limit=100`,
    { headers: ghlHeaders(token), cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const contacts: { tags?: string[] }[] = data?.contacts || [];
  const freq = new Map<string, number>();
  const re = /^webinar_(\d{2}_\d{2}_\d{2})_optin$/;
  for (const c of contacts) {
    for (const t of c.tags || []) {
      const m = re.exec(t);
      if (m) freq.set(m[1], (freq.get(m[1]) || 0) + 1);
    }
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [date, n] of Array.from(freq.entries())) {
    if (n > bestN) {
      bestN = n;
      best = date;
    }
  }
  return best;
}

function formatWebinarDate(slug: string): string {
  // "17_06_26" → "17.06.2026"
  const [dd, mm, yy] = slug.split("_");
  if (!dd || !mm || !yy) return slug;
  return `${dd}.${mm}.20${yy}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  const token = process.env.GHL_TIBOR_TOKEN;
  const locationId = process.env.GHL_TIBOR_LOCATION_ID || FALLBACK_LOCATION;

  if (!token) {
    return NextResponse.json(
      { error: "GHL token not configured" },
      { status: 500 }
    );
  }

  // Allow ?webinar=DD_MM_YY override; otherwise auto-detect the active one.
  const override = request.nextUrl.searchParams.get("webinar");
  let webinar = override;
  if (!webinar) {
    try {
      webinar = await detectWebinar(token, locationId);
    } catch {
      webinar = null;
    }
  }
  if (!webinar) webinar = FALLBACK_WEBINAR;

  const optinTag = `webinar_${webinar}_optin`;
  const applicationTag = `webinar_${webinar}_application`;

  try {
    // One sampled search gives us BOTH the optin total and the contact tags we
    // need to discover which source suffixes exist for this webinar.
    const [sample, application] = await Promise.all([
      sampleTag(token, locationId, optinTag, 100),
      countTag(token, locationId, applicationTag),
    ]);

    const optin = sample.total;

    // Discover source suffixes: tags shaped `<optinTag>_<source>`.
    const prefix = `${optinTag}_`;
    const sourceKeys = new Set<string>();
    for (const c of sample.contacts) {
      for (const t of c.tags || []) {
        if (t.startsWith(prefix)) sourceKeys.add(t.slice(prefix.length));
      }
    }

    // Exact count per source.
    const sources = await Promise.all(
      Array.from(sourceKeys).map(async (key) => ({
        key,
        label: sourceLabel(key),
        count: await countTag(token, locationId, `${prefix}${key}`),
      }))
    );
    // Largest first; stable for display.
    sources.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      org: params.orgSlug,
      webinar,
      webinarLabel: formatWebinarDate(webinar),
      optin,
      application,
      sources,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "GHL request failed" },
      { status: 502 }
    );
  }
}
