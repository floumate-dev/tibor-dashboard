-- Sales calls / opportunities (GHL pipeline)
-- One row per sales call/opportunity. Upserted by (org_id, external_id) as the
-- GHL opportunity moves through stages, so the same opportunity is one row.

create table calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  external_id text,                       -- GHL opportunity id (for idempotent upsert)
  contact_name text,
  contact_email text,
  contact_phone text,
  package text,                           -- placeholder for now (1:1 Mentorship / Grupni / Kurs / Custom)
  amount decimal not null default 0,
  currency text default 'EUR',
  stage text not null default 'scheduled'
    check (stage in ('scheduled', 'showed_up', 'won', 'lost', 'no_show')),
  lost_reason text,                       -- free-text reason when stage = 'lost'
  lost_reason_cluster text,               -- filled later by LLM clustering
  setter text,                            -- appointment setter name
  closer text,                            -- closer/salesman name
  source text not null default 'direct',
  scheduled_at timestamptz,              -- when the call is/was booked
  closed_at timestamptz,                 -- when it reached a terminal stage (won/lost/no_show)
  raw_data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Idempotent upsert target for GHL webhooks.
-- Full (non-partial) unique index so PostgREST ON CONFLICT inference works.
-- NULL external_id rows never conflict (Postgres treats NULLs as distinct),
-- so manual/non-GHL inserts are unaffected.
create unique index idx_calls_org_external on calls(org_id, external_id);

-- Dashboard query indexes
create index idx_calls_org_created on calls(org_id, created_at desc);
create index idx_calls_org_stage on calls(org_id, stage);
create index idx_calls_org_scheduled on calls(org_id, scheduled_at desc);

-- Keep updated_at fresh on every change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger calls_set_updated_at
  before update on calls
  for each row execute function set_updated_at();

-- RLS (mirrors leads/purchases: admin sees all, client sees own org)
alter table calls enable row level security;

create policy "admins see all calls" on calls for select using (
  exists (select 1 from app_users where id = auth.uid() and role = 'admin')
);
create policy "clients see own calls" on calls for select using (
  exists (select 1 from app_users where id = auth.uid() and org_id = calls.org_id)
);
-- Webhook inserts/updates use the service role key, which bypasses RLS.

-- Tibor organization (client/partner — video-editing coaching)
insert into organizations (name, slug)
values ('Tibor', 'tibor')
on conflict (slug) do nothing;
