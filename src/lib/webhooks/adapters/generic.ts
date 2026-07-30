export interface ParsedLead {
  source: string;
  medium: string | null;
  campaign: string | null;
  email: string | null;
  raw_data: Record<string, unknown>;
}

export interface ParsedPurchase {
  source: string;
  medium: string | null;
  campaign: string | null;
  amount: number;
  currency: string;
  email: string | null;
  raw_data: Record<string, unknown>;
}

export function parseGenericLead(body: Record<string, unknown>): ParsedLead {
  return {
    source: (body.source as string) || (body.utm_source as string) || "direct",
    medium: (body.medium as string) || (body.utm_medium as string) || null,
    campaign:
      (body.campaign as string) || (body.utm_campaign as string) || null,
    email: (body.email as string) || null,
    raw_data: body,
  };
}

export function parseGenericPurchase(
  body: Record<string, unknown>
): ParsedPurchase {
  return {
    source: (body.source as string) || (body.utm_source as string) || "direct",
    medium: (body.medium as string) || (body.utm_medium as string) || null,
    campaign:
      (body.campaign as string) || (body.utm_campaign as string) || null,
    amount: Number(body.amount) || 0,
    currency: (body.currency as string) || "EUR",
    email: (body.email as string) || null,
    raw_data: body,
  };
}
