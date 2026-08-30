-- 005: DM sales / appointment-setting metrics (Instagram DM funnel).
--
-- One setter (Burno) radi Tiborov IG nalog. Tri izvora, svaki šalje webhook:
--   instagram (Meta Messaging)  → inbound/outbound poruke, konverzacije, slanje
--                                 booking/payment linka (echo hvata i ručno
--                                 poslate poruke iz native app-a).
--   iclosed                     → zakazani pozivi (DM-atribuirani: source=burno).
--   stripe                      → kupovine + prihod (DM-atribuirani: source=burno).
--
-- Arhitektura = trigger/materialized (handoff §2): svaki event se DEDUP-uje u
-- dm_events (unique po (org, source, external_id)) i inkrementira SAMO svoj
-- dan-slice u dm_daily. dm_threads broji poruke po konverzaciji da se
-- "konverzacija" (>2 poruke) izbroji tačno jednom — na dan kad pređe 3. poruku.
-- Dashboard čita SAMO dm_daily (jedan brz query). RLS on, bez public polisa
-- (samo service-role), isto kao evergreen tabele. Idempotentnost = dedup na
-- insert, pa reconciliation cron sme da re-šalje bez duplog brojanja.
--
-- NB: dan se računa u Europe/Belgrade (isto kao evergreen).
-- NB: TEKST poruke se NE čuva (privatnost DM-a) — samo izvedeni bulovi/smer.

-- ---- raw event log (idempotency + audit + reconciliation) ----
create table if not exists dm_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  source text not null check (source in ('instagram','iclosed','stripe')),
  external_id text not null,                 -- IG mid / iClosed booking id / Stripe event id
  kind text not null check (kind in ('message','appointment','purchase')),
  direction text check (direction in ('in','out')),  -- samo za poruke
  thread_id text,                            -- IG: IGSID sagovornika (ključ konverzacije)
  has_booking_link boolean not null default false,
  has_payment_link boolean not null default false,
  attributed boolean not null default true,  -- source=burno prisutan (iclosed/stripe)
  amount numeric not null default 0,
  currency text default 'EUR',
  occurred_at timestamptz not null default now(),
  day date not null,                         -- occurred_at u Europe/Belgrade
  raw_data jsonb default '{}',
  created_at timestamptz default now(),
  unique (org_id, source, external_id)
);
create index if not exists idx_dm_events_org_day on dm_events(org_id, day);
create index if not exists idx_dm_events_thread on dm_events(org_id, thread_id);

-- ---- brojač poruka po konverzaciji (za "konverzacija = >2 poruke", jednom) ----
create table if not exists dm_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  thread_id text not null,
  msg_count int not null default 0,
  qualified boolean not null default false,  -- prešao >2 poruke
  qualified_day date,
  first_at timestamptz,
  last_at timestamptz,
  unique (org_id, thread_id)
);

-- ---- dnevni materijalizovani agregat — dashboard čita SAMO ovo ----
create table if not exists dm_daily (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  day date not null,
  outbound int not null default 0,        -- poruke poslate (Burno)
  inbound int not null default 0,         -- poruke primljene
  conversations int not null default 0,   -- nove konverzacije (>2 poruke) tog dana
  booking_links int not null default 0,   -- poslati booking (iClosed) linkovi
  payment_links int not null default 0,   -- poslati payment linkovi
  appointments int not null default 0,    -- zakazani pozivi (iClosed)
  purchases int not null default 0,       -- kupovine (Stripe)
  revenue numeric not null default 0,
  currency text default 'EUR',
  updated_at timestamptz default now(),
  unique (org_id, day)
);
create index if not exists idx_dm_daily_org_day on dm_daily(org_id, day desc);

alter table dm_events enable row level security;
alter table dm_threads enable row level security;
alter table dm_daily enable row level security;
-- Bez public polisa: čitanje ide kroz server rute sa service-role ključem.
