// Instagram Graph API pull za DM reconciliation (safety net za propuštene
// webhookove). Vuče skorašnje konverzacije + poruke i vraća ih u istom obliku
// kao webhook adapter, da bi dm_apply_message (idempotentno po mid) popunio
// eventualne rupe. NE koristi se na user-path-u — samo iz crona.
//
// VAŽNO: dedup radi po `mid`. Ako se Graph message `id` poklapa sa webhook
// `mid` (očekivano za IG messaging) — reconciliation je bezbedan. Zato cron
// piše tek kad je DM_RECONCILE_WRITE=true (dok se ne potvrdi na živim podacima).

import { detectLinks, type DmMessage } from "@/lib/webhooks/adapters/dm";

const GRAPH = "https://graph.facebook.com/v21.0";

type GraphMsg = {
  id?: string;
  from?: { id?: string };
  created_time?: string;
  message?: string;
};
type GraphConv = {
  id?: string;
  participants?: { data?: { id?: string }[] };
  messages?: { data?: GraphMsg[] };
};

// Vrati skorašnje poruke (bounded) kao DmMessage[]. limit = broj konverzacija.
export async function pullRecentIgMessages(
  token: string,
  businessId: string,
  limit = 25
): Promise<DmMessage[]> {
  const url =
    `${GRAPH}/${businessId}/conversations?platform=instagram` +
    `&fields=${encodeURIComponent("participants,messages.limit(50){id,from,created_time,message}")}` +
    `&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`IG conversations HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: GraphConv[] };
  const convs = json.data || [];
  const out: DmMessage[] = [];

  for (const c of convs) {
    const parts = c.participants?.data || [];
    const other = parts.map((p) => p.id).find((id) => id && id !== businessId) || null;
    for (const m of c.messages?.data || []) {
      if (!m.id) continue;
      const fromId = m.from?.id ? String(m.from.id) : undefined;
      const direction: "in" | "out" = fromId === businessId ? "out" : "in";
      const threadId = other || (direction === "out" ? null : fromId || null);
      const { hasBooking, hasPayment } = detectLinks(m.message || "");
      out.push({
        mid: String(m.id),
        threadId,
        occurredAt: m.created_time ? new Date(m.created_time).toISOString() : new Date().toISOString(),
        direction,
        hasBooking,
        hasPayment,
      });
    }
  }
  return out;
}
