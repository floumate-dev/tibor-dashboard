// Adapteri za DM department (Instagram DM funnel).
// Tri izvora: Instagram Messaging webhook, iClosed booking, Stripe purchase.
// Ne čuvamo tekst poruke (privatnost) — samo izvedene bulove/smer.

// ─────────────────────────────────────────────────────────────────────────────
// DETEKCIJA LINKOVA — potvrdi domene sa Burnom pre produkcije.
//   BOOKING = iClosed link koji Burno šalje.
//   PAYMENT = payment link. Burnovi linkovi nose `source=burno`; i booking i
//   payment ga imaju, pa payment razlikujemo po tome što NIJE iClosed domen
//   (plus eksplicitno Stripe domeni). Dodaj domene preko env varijabli:
//   DM_BOOKING_DOMAINS / DM_PAYMENT_DOMAINS (zarezom razdvojeno).
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_BOOKING_DOMAINS = ["iclosed.io"];
const DEFAULT_PAYMENT_DOMAINS = ["buy.stripe.com", "checkout.stripe.com", "pay.stripe.com"];

function envDomains(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function hasDomain(text: string, domains: string[]): boolean {
  const t = text.toLowerCase();
  return domains.some((d) => d && t.includes(d));
}

export function detectLinks(text: string): { hasBooking: boolean; hasPayment: boolean } {
  const t = text || "";
  const bookingDomains = [...DEFAULT_BOOKING_DOMAINS, ...envDomains("DM_BOOKING_DOMAINS")];
  const paymentDomains = [...DEFAULT_PAYMENT_DOMAINS, ...envDomains("DM_PAYMENT_DOMAINS")];
  const hasBooking = hasDomain(t, bookingDomains);
  const burnoLink = /source=burno/i.test(t);
  const hasPayment =
    hasDomain(t, paymentDomains) || (burnoLink && !hasBooking);
  return { hasBooking, hasPayment };
}

// "burno" atribucija bilo gde u relevantnim poljima (source=burno, client_reference_id, metadata…)
export function hasBurno(...parts: unknown[]): boolean {
  for (const p of parts) {
    if (p == null) continue;
    let s: string;
    try {
      s = typeof p === "string" ? p : JSON.stringify(p);
    } catch {
      continue;
    }
    if (/burno/i.test(s)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTAGRAM
// ─────────────────────────────────────────────────────────────────────────────
export interface DmMessage {
  mid: string;
  threadId: string | null;
  occurredAt: string; // ISO
  direction: "in" | "out";
  hasBooking: boolean;
  hasPayment: boolean;
}

type IgEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
  };
};

function isoFromMsOrSec(ts: unknown, fallback?: number): string {
  const n = Number(ts);
  if (Number.isFinite(n) && n > 0) {
    // Meta šalje ms; ako je premalo (sekunde), pomnoži.
    const ms = n < 1e12 ? n * 1000 : n;
    return new Date(ms).toISOString();
  }
  if (fallback) {
    const ms = fallback < 1e12 ? fallback * 1000 : fallback;
    return new Date(ms).toISOString();
  }
  return new Date().toISOString();
}

// businessId = IGSID/Page-scoped id Tiborovog naloga; koristi se za smer kad
// echo flag nije prisutan. Prosledi iz env IG_BUSINESS_ID.
export function parseInstagramEvents(
  body: Record<string, unknown>,
  businessId?: string
): DmMessage[] {
  const out: DmMessage[] = [];
  const entries = Array.isArray(body.entry) ? (body.entry as Record<string, unknown>[]) : [];

  for (const entry of entries) {
    const entryTime = Number(entry.time) || undefined;
    const raw: IgEvent[] = [];

    // Klasičan Messenger Platform oblik: entry.messaging[]
    if (Array.isArray(entry.messaging)) raw.push(...(entry.messaging as IgEvent[]));

    // Instagram-login oblik: entry.changes[] sa field="messages"
    if (Array.isArray(entry.changes)) {
      for (const ch of entry.changes as Record<string, unknown>[]) {
        if (ch.field === "messages" && ch.value && typeof ch.value === "object") {
          raw.push(ch.value as IgEvent);
        }
      }
    }

    for (const ev of raw) {
      const msg = ev.message;
      if (!msg || !msg.mid || msg.is_deleted) continue; // reactions/reads/deletes → preskoči

      const senderId = ev.sender?.id ? String(ev.sender.id) : undefined;
      const recipientId = ev.recipient?.id ? String(ev.recipient.id) : undefined;

      const isEcho =
        msg.is_echo === true ||
        (businessId ? senderId === businessId : false);
      const direction: "in" | "out" = isEcho ? "out" : "in";
      const threadId = (direction === "out" ? recipientId : senderId) || null;

      const { hasBooking, hasPayment } = detectLinks(msg.text || "");

      out.push({
        mid: String(msg.mid),
        threadId,
        occurredAt: isoFromMsOrSec(ev.timestamp, entryTime),
        direction,
        hasBooking,
        hasPayment,
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// iCLOSED (zakazan poziv)
// ─────────────────────────────────────────────────────────────────────────────
export interface DmBooking {
  externalId: string;
  occurredAt: string;
  attributed: boolean;
  raw: Record<string, unknown>;
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

export function parseIclosedBooking(body: Record<string, unknown>): DmBooking {
  // iClosed payload varira; probaj tipične ključeve + ugnježdene objekte.
  const nested =
    (body.booking as Record<string, unknown>) ||
    (body.appointment as Record<string, unknown>) ||
    (body.data as Record<string, unknown>) ||
    {};
  const src = { ...nested, ...body };

  const externalId =
    pickStr(src, "booking_id", "bookingId", "appointment_id", "appointmentId", "id", "event_id", "eventId") ||
    // fallback stabilan ključ: email + zakazano vreme
    `${pickStr(src, "email", "contact_email") || "?"}|${pickStr(src, "scheduled_at", "start_time", "startTime", "start") || ""}`;

  const occurredAt =
    pickStr(src, "created_at", "createdAt", "booked_at", "bookedAt", "timestamp") ||
    new Date().toISOString();

  return {
    externalId,
    occurredAt,
    attributed: hasBurno(src.source, src.utm_source, (src as { metadata?: unknown }).metadata, src),
    raw: body,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STRIPE (kupovina)
// ─────────────────────────────────────────────────────────────────────────────
export interface DmPurchase {
  externalId: string;
  occurredAt: string;
  amount: number;
  currency: string;
  attributed: boolean;
  raw: Record<string, unknown>;
}

const STRIPE_PURCHASE_TYPES = new Set([
  "checkout.session.completed",
  "charge.succeeded",
  "payment_intent.succeeded",
]);

// Vrati null ako event nije "uspešna kupovina" tip.
export function parseStripePurchase(event: Record<string, unknown>): DmPurchase | null {
  const type = String(event.type || "");
  if (!STRIPE_PURCHASE_TYPES.has(type)) return null;

  const data = (event.data as Record<string, unknown>) || {};
  const obj = (data.object as Record<string, unknown>) || {};

  // amount: checkout.session → amount_total; charge/pi → amount (u centima)
  const cents =
    Number(obj.amount_total ?? obj.amount ?? obj.amount_received ?? 0) || 0;
  const amount = cents / 100;
  const currency = String(obj.currency || "eur").toUpperCase();

  const metadata = (obj.metadata as Record<string, unknown>) || {};
  const clientRef = obj.client_reference_id;
  const attributed = hasBurno(metadata, clientRef, obj.payment_link, (obj as { source?: unknown }).source);

  const occurredAt = isoFromMsOrSec(event.created ?? obj.created);

  return {
    externalId: String(event.id || obj.id || `${type}|${occurredAt}`),
    occurredAt,
    amount,
    currency,
    attributed,
    raw: event,
  };
}
