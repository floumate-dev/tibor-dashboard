-- Organizations (Markovi klijenti)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Integrations per organization
create table integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  platform text not null,
  type text not null check (type in ('form', 'payment')),
  webhook_secret text default encode(gen_random_bytes(32), 'hex'),
  config jsonb default '{}',
  created_at timestamptz default now()
);

-- Leads (form submissions)
create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  integration_id uuid references integrations(id) on delete set null,
  source text not null default 'direct',
  medium text,
  campaign text,
  email text,
  raw_data jsonb default '{}',
  created_at timestamptz default now()
);

-- Purchases
create table purchases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  integration_id uuid references integrations(id) on delete set null,
  source text not null default 'direct',
  medium text,
  campaign text,
  amount decimal not null default 0,
  currency text default 'EUR',
  email text,
  raw_data jsonb default '{}',
  created_at timestamptz default now()
);

-- App users (extends Supabase Auth)
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'client' check (role in ('admin', 'client')),
  org_id uuid references organizations(id) on delete set null
);

-- Indexes for dashboard queries
create index idx_leads_org_created on leads(org_id, created_at desc);
create index idx_leads_org_source on leads(org_id, source);
create index idx_purchases_org_created on purchases(org_id, created_at desc);
create index idx_purchases_org_source on purchases(org_id, source);

-- RLS policies
alter table organizations enable row level security;
alter table integrations enable row level security;
alter table leads enable row level security;
alter table purchases enable row level security;
alter table app_users enable row level security;

-- Admin can see everything, clients only their org
create policy "admins see all orgs" on organizations for select using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);
create policy "clients see own org" on organizations for select using (
  exists (select 1 from app_users where id = auth.uid() and org_id = organizations.id)
);

create policy "admins manage all orgs" on organizations for all using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);

create policy "admins see all integrations" on integrations for select using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);
create policy "clients see own integrations" on integrations for select using (
  exists (select 1 from app_users where id = auth.uid() and org_id = integrations.org_id)
);
create policy "admins manage integrations" on integrations for all using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);

create policy "admins see all leads" on leads for select using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);
create policy "clients see own leads" on leads for select using (
  exists (select 1 from app_users where id = auth.uid() and org_id = leads.org_id)
);

create policy "admins see all purchases" on purchases for select using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);
create policy "clients see own purchases" on purchases for select using (
  exists (select 1 from app_users where id = auth.uid() and org_id = purchases.org_id)
);

-- Webhooks need to insert without auth (service role key used server-side)
-- We'll use service role for webhook inserts, so no public insert policy needed

create policy "users see own profile" on app_users for select using (
  id = auth.uid()
);
