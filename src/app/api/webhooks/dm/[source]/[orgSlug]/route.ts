import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import {
  parseInstagramEvents,
  parseIclosedBooking,
  parseStripePurchase,
} from "@/lib/webhooks/adapters/dm";

// Node runtime (crypto za verifikaciju potpisa; Edge nema Node crypto).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function timingSafeEq(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ── Meta (Instagram) GET verifikacija webhooka ──
export async function GET(
  request: NextRequest,
  { params }: { params: { source: string; orgSlug: string } }
) {
  if (params.source !== "instagram") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.META_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

function verifyInstagram(rawBody: string, header: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // dev: bez app secreta preskoči (postavi u produkciji)
  if (!header) return false;
  const sig = header.startsWith("sha256=") ? header.slice(7) : header;
  const hmac = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return timingSafeEq(sig, hmac);
}

function verifyStripe(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return true; // dev: preskoči dok se ne postavi
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string])
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`, "utf8")
    .digest("hex");
  return timingSafeEq(v1, hmac);
}

function verifyIclosed(request: NextRequest): boolean {
  const secret = process.env.ICLOSED_WEBHOOK_SECRET;
  if (!secret) return true; // dev/opciono: iClosed nema standardni potpis
  const header = request.headers.get("x-webhook-secret");
  const q = new URL(request.url).searchParams.get("secret");
  return header === secret || q === secret;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { source: string; orgSlug: string } }
) {
  const { source, orgSlug } = params;
  const rawBody = await request.text();

  // ── verifikacija po izvoru ──
  if (source === "instagram" && !verifyInstagram(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  if (source === "stripe" && !verifyStripe(rawBody, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  if (source === "iclosed" && !verifyIclosed(request)) {
    return NextResponse.json({ error: "bad secret" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .single();
  if (!org) {
    return NextResponse.json({ error: "org not found" }, { status: 404 });
  }
  const orgId = org.id as string;

  // ── INSTAGRAM ──
  if (source === "instagram") {
    const events = parseInstagramEvents(body, process.env.IG_BUSINESS_ID);
    let applied = 0;
    for (const e of events) {
      const { error } = await supabase.rpc("dm_apply_message", {
        p_org: orgId,
        p_mid: e.mid,
        p_thread: e.threadId,
        p_occurred: e.occurredAt,
        p_direction: e.direction,
        p_has_booking: e.hasBooking,
        p_has_payment: e.hasPayment,
        p_raw: {},
      });
      if (error) console.error("dm_apply_message error:", error.message);
      else applied++;
    }
    // Meta zahteva brz 200 bez obzira na sadržaj.
    return NextResponse.json({ ok: true, events: events.length, applied });
  }

  // ── iCLOSED (zakazan poziv) ──
  if (source === "iclosed") {
    const b = parseIclosedBooking(body);
    const requireAttr = process.env.ICLOSED_REQUIRE_ATTRIBUTION !== "false";
    if (requireAttr && !b.attributed) {
      return NextResponse.json({ ok: true, skipped: "not attributed to burno" });
    }
    const { error } = await supabase.rpc("dm_apply_conversion", {
      p_org: orgId,
      p_source: "iclosed",
      p_external_id: b.externalId,
      p_kind: "appointment",
      p_occurred: b.occurredAt,
      p_amount: 0,
      p_currency: null,
      p_attributed: b.attributed,
      p_raw: b.raw,
    });
    if (error) {
      console.error("dm_apply_conversion (iclosed) error:", error.message);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, type: "appointment" });
  }

  // ── STRIPE (kupovina) ──
  if (source === "stripe") {
    const p = parseStripePurchase(body);
    if (!p) return NextResponse.json({ ok: true, ignored: String(body.type || "") });
    const requireAttr = process.env.STRIPE_REQUIRE_ATTRIBUTION !== "false";
    if (requireAttr && !p.attributed) {
      return NextResponse.json({ ok: true, skipped: "not attributed to burno" });
    }
    const { error } = await supabase.rpc("dm_apply_conversion", {
      p_org: orgId,
      p_source: "stripe",
      p_external_id: p.externalId,
      p_kind: "purchase",
      p_occurred: p.occurredAt,
      p_amount: p.amount,
      p_currency: p.currency,
      p_attributed: p.attributed,
      p_raw: p.raw,
    });
    if (error) {
      console.error("dm_apply_conversion (stripe) error:", error.message);
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, type: "purchase", amount: p.amount });
  }

  return NextResponse.json({ error: "unknown source" }, { status: 404 });
}
