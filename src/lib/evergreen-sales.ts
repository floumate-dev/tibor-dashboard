// Evergreen SALES pipeline — Stripe is the source of truth.
//
// One module shared by every writer so classification + attribution can never
// drift between them:
//   • /api/webhooks/stripe   — live: a new checkout session -> a sale row
//   • /api/cron/sales        — reconcile / backfill: re-pull a Stripe window
//
// A sale is an INITIAL Editunovac payment (the €47 / €97.99 evergreen product):
// statement descriptor "EDIT U NOVAC", paid, and NOT a "Subscription update"
// (that's a rebill, not a new customer). Attribution to a webinar day is
// last-touch via GHL dated optin tags, preferring a day the buyer attended.
import type { SupabaseClient } from "@supabase/supabase-js";

const STRIPE_BASE = "https://api.stripe.com/v1";
const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "Zyilin5HFiDuC461lVdk";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Stripe ──────────────────────────────────────────────────────────────────
export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  paid: boolean;
  refunded: boolean;
  amount_refunded: number;
  created: number;
  description: string | null;
  calculated_statement_descriptor: string | null;
  statement_descriptor: string | null;
  billing_details?: { email?: string | null; phone?: string | null };
  receipt_email?: string | null;
}

async function stripeGet(path: string, key: string): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${STRIPE_BASE}${path}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (res.status === 429 || res.status >= 500) {
      await sleep(500 * Math.pow(2, attempt));
      continue;
    }
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) throw new Error(`Stripe ${res.status}: ${JSON.stringify(json)}`);
    return json;
  }
  throw new Error("Stripe: max retries");
}

// The evergreen webinar product costs 97.99 EUR (accept 98.00 too). The
// "EDIT U NOVAC" statement descriptor is shared by OTHER Editunovac products
// (a 47€ offer, 141€, and the 2500€ high-ticket + its installments), so the
// price is what pins a charge to the evergreen funnel — descriptor alone is not
// enough. Amounts are integer cents.
const EVERGREEN_CENTS = new Set([9799, 9800]);

// A charge is a countable evergreen sale: paid 97.99/98 EUR Editunovac, not a rebill.
export function isEvergreenSale(c: StripeCharge): boolean {
  if (!c.paid) return false;
  if (c.currency !== "eur" || !EVERGREEN_CENTS.has(c.amount)) return false;
  const sd = `${c.calculated_statement_descriptor || ""} ${c.statement_descriptor || ""}`;
  if (!/edit\s*u\s*novac/i.test(sd)) return false;
  if (/update/i.test(c.description || "")) return false; // renewal/rebill, not a new sale
  return true;
}

export function chargeEmail(c: StripeCharge): string {
  return (c.billing_details?.email || c.receipt_email || "").trim().toLowerCase();
}
export function chargePhone(c: StripeCharge): string {
  return (c.billing_details?.phone || "").trim();
}

// Pull every charge created in [sinceUnix, untilUnix) — paginated (100/page).
export async function listCharges(key: string, sinceUnix: number, untilUnix?: number): Promise<StripeCharge[]> {
  const out: StripeCharge[] = [];
  let startingAfter: string | null = null;
  for (;;) {
    const params = new URLSearchParams({ limit: "100", "created[gte]": String(sinceUnix) });
    if (untilUnix) params.set("created[lt]", String(untilUnix));
    if (startingAfter) params.set("starting_after", startingAfter);
    const page = (await stripeGet(`/charges?${params}`, key)) as { data: StripeCharge[]; has_more: boolean };
    out.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return out;
}

// Fetch one charge by id (used by the webhook to resolve a checkout session's
// underlying charge, so live + backfill classify identically).
export async function getCharge(key: string, id: string): Promise<StripeCharge> {
  return (await stripeGet(`/charges/${id}`, key)) as unknown as StripeCharge;
}
export async function getSession(key: string, id: string): Promise<Record<string, unknown>> {
  return stripeGet(`/checkout/sessions/${id}`, key);
}

// Resolve the underlying charge for a completed checkout session so the live
// webhook classifies with the exact same rule as the backfill. Subscription
// checkouts pay via an invoice (session.invoice -> invoice.charge); one-time
// checkouts via a payment intent (session.payment_intent -> latest_charge).
// Returns null when the charge can't be resolved — the reconcile cron will
// then pick the sale up from Stripe within its window (defense in depth).
export async function resolveSessionCharge(
  key: string,
  session: Record<string, unknown>
): Promise<StripeCharge | null> {
  try {
    const pi = session.payment_intent as string | null;
    if (pi) {
      const intent = (await stripeGet(`/payment_intents/${pi}`, key)) as { latest_charge?: string };
      if (intent.latest_charge) return await getCharge(key, intent.latest_charge);
    }
    const inv = session.invoice as string | null;
    if (inv) {
      const invoice = (await stripeGet(`/invoices/${inv}`, key)) as { charge?: string };
      if (invoice.charge) return await getCharge(key, invoice.charge);
    }
  } catch {
    return null;
  }
  return null;
}

// ── GHL attribution ───────────────────────────────────────────────────────
const OPTIN_RE = /^evergreen_webinar_(\d{2})_(\d{2})_(\d{2})_optin$/;

async function ghlDuplicate(token: string, param: "email" | "number", value: string): Promise<string[] | null> {
  const q = new URLSearchParams({ locationId: LOCATION_ID, [param]: value });
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${GHL_BASE}/contacts/search/duplicate?${q}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        Accept: "application/json",
        "User-Agent": "floumate-sales/1.0",
      },
      cache: "no-store",
    });
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(ra > 0 ? ra * 1000 : 600 * Math.pow(2, attempt));
      continue;
    }
    if (!res.ok) return null;
    const d = (await res.json()) as { contact?: { tags?: string[] } | null };
    return d?.contact ? d.contact.tags || [] : null; // null = contact not found
  }
  return null;
}

function optinDaysFromTags(tags: string[]): string[] {
  const days: string[] = [];
  for (const t of tags) {
    const m = OPTIN_RE.exec(t);
    if (m) days.push(`20${m[3]}-${m[2]}-${m[1]}`);
  }
  return days.sort();
}

const WEBINAR_START = "2026-06-30"; // first evergreen day

export interface Attribution {
  webinar_date: string | null;
  attribution: "attended" | "optin" | "phone_optin" | "purchase_time" | "unmatched";
}

// Purchase-time fallback: the webinar runs daily at 20:00 Europe/Belgrade
// (=18:00 UTC) and buyers convert on the live pitch, so a payment maps to the
// most recent 18:00-UTC webinar boundary before it (a purchase before today's
// 18:00 belongs to yesterday's webinar). Used only when GHL has no optin tag,
// so every real Stripe sale still lands on a day and the per-day totals equal
// Stripe. Empirically validated against the optin-matched set before rollout.
export function webinarDayFromPurchase(paidAtISO: string): string {
  const t = new Date(paidAtISO);
  const boundary = new Date(t);
  if (t.getUTCHours() < 18) boundary.setUTCDate(boundary.getUTCDate() - 1);
  return boundary.toISOString().slice(0, 10);
}

// Last-touch attribution for a sale. Finds the buyer in GHL (email, then phone),
// reads dated optin tags, and picks the latest optin on/before the purchase —
// preferring one the buyer actually attended (evergreen_attendees). Unmatched
// sales return {null,"unmatched"} and are still stored so totals equal Stripe.
export async function attributeSale(
  supabase: SupabaseClient,
  ghlToken: string,
  orgId: string,
  email: string,
  phone: string,
  paidAtISO: string
): Promise<Attribution> {
  const pdate = paidAtISO.slice(0, 10);
  // Fallback used whenever GHL yields no dated optin (buyer under a different
  // email, or no optin tag). Never leaves a real sale unattributed.
  const fallback = (): Attribution => {
    const day = webinarDayFromPurchase(paidAtISO);
    return day >= WEBINAR_START
      ? { webinar_date: day, attribution: "purchase_time" }
      : { webinar_date: null, attribution: "unmatched" };
  };
  let via: "email" | "phone" = "email";
  let tags: string[] | null = email ? await ghlDuplicate(ghlToken, "email", email) : null;
  if (tags === null && phone) {
    tags = await ghlDuplicate(ghlToken, "number", phone);
    if (tags !== null) via = "phone";
  }
  if (tags === null) return fallback();

  const optins = optinDaysFromTags(tags);
  if (!optins.length) return fallback();

  const eligible = optins.filter((d) => d <= pdate);
  const pool = eligible.length ? eligible : optins; // fallback: bought before optin indexed

  // Prefer a day in the pool the buyer actually attended.
  if (email) {
    const { data: att } = await supabase
      .from("evergreen_attendees")
      .select("webinar_date")
      .eq("org_id", orgId)
      .eq("email", email)
      .eq("attended", true)
      .in("webinar_date", pool);
    if (att && att.length) {
      const day = att.map((r) => r.webinar_date as string).sort().pop()!;
      return { webinar_date: day, attribution: "attended" };
    }
  }
  const day = pool[pool.length - 1];
  return { webinar_date: day, attribution: via === "phone" ? "phone_optin" : "optin" };
}

// ── upsert ────────────────────────────────────────────────────────────────
// Idempotent by (org_id, stripe_id). The DB trigger recomputes the day's
// conversions from evergreen_sales, so callers never touch evergreen_webinars.
export async function upsertSale(
  supabase: SupabaseClient,
  orgId: string,
  c: StripeCharge,
  attr: Attribution
): Promise<{ error: string | null }> {
  const row = {
    org_id: orgId,
    stripe_id: c.id,
    email: chargeEmail(c) || null,
    phone: chargePhone(c) || null,
    amount: c.amount / 100,
    currency: c.currency,
    paid_at: new Date(c.created * 1000).toISOString(),
    webinar_date: attr.webinar_date,
    attribution: attr.attribution,
    refunded: c.refunded || c.amount_refunded > 0,
    raw: {
      description: c.description,
      csd: c.calculated_statement_descriptor,
    },
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("evergreen_sales")
    .upsert(row, { onConflict: "org_id,stripe_id" });
  return { error: error ? error.message : null };
}
