export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Integration {
  id: string;
  org_id: string;
  platform: string;
  type: "form" | "payment";
  webhook_secret: string;
  config: Record<string, unknown>;
  created_at: string;
}

export interface Lead {
  id: string;
  org_id: string;
  integration_id: string | null;
  source: string;
  medium: string | null;
  campaign: string | null;
  email: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface Purchase {
  id: string;
  org_id: string;
  integration_id: string | null;
  source: string;
  medium: string | null;
  campaign: string | null;
  amount: number;
  currency: string;
  email: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  role: "admin" | "client";
  org_id: string | null;
}

export interface SourceStats {
  source: string;
  count: number;
}

export interface TimelinePoint {
  date: string;
  leads: number;
  purchases: number;
}

export type DateRange = "today" | "7d" | "30d" | "90d" | "all";
