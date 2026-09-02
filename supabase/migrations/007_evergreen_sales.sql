-- 007: Evergreen SALES = Stripe as the single source of truth.
--
-- Why: the dashboard used to count the GHL `bought_eun` tag as "conversions".
-- That tag was applied by a lossy manual Stripe->GHL email match, so buyers who
-- used a different email (or were never tagged) went uncounted and totals drifted
-- from Stripe. This table records EVERY real Stripe payment; a trigger keeps
-- evergreen_webinars.conversions in lock-step with it, so the number can never
-- silently diverge from Stripe again.
--
-- One row per Stripe charge (idempotent on stripe_id). Attribution to a webinar
-- day is last-touch: latest dated optin (`evergreen_webinar_<DD_MM_YY>_optin`)
-- on/before the purchase, preferring a day the buyer actually attended. Sales we
-- cannot attribute are still stored (webinar_date null) so the grand total always
-- equals Stripe. Reads go through the service-role key (RLS on, no public policy).

create table if not exists evergreen_sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  stripe_id text not null,                        -- charge id (idempotency key)
  email text,
  phone text,
  amount numeric not null default 0,              -- major units (EUR)
  currency text not null default 'eur',
  paid_at timestamptz not null,                   -- Stripe charge created time
  webinar_date date,                              -- attributed day (null = unattributed)
  attribution text not null default 'unmatched',  -- attended | optin | phone_optin | unmatched
  refunded boolean not null default false,
  raw jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, stripe_id)
);

create index if not exists idx_evg_sales_org_day on evergreen_sales(org_id, webinar_date);
create index if not exists idx_evg_sales_paid on evergreen_sales(org_id, paid_at);

alter table evergreen_sales enable row level security;

-- Recompute one day's conversions from evergreen_sales (non-refunded, attributed).
-- Creates the evergreen_webinars row if the day has no registrant row yet.
create or replace function evergreen_sales_recount(p_org uuid, p_day date)
returns void language plpgsql as $$
declare c int;
begin
  if p_day is null then return; end if;
  select count(*) into c from evergreen_sales
    where org_id = p_org and webinar_date = p_day and refunded = false;
  insert into evergreen_webinars (org_id, webinar_date, conversions, updated_at)
    values (p_org, p_day, c, now())
  on conflict (org_id, webinar_date)
    do update set conversions = excluded.conversions, updated_at = now();
end $$;

-- Keep evergreen_webinars.conversions in sync on every sale insert/update/delete.
-- Stripe is now the ONLY writer of conversions; the GHL cron must not set it.
create or replace function evergreen_sales_trg()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform evergreen_sales_recount(old.org_id, old.webinar_date);
    return old;
  end if;
  perform evergreen_sales_recount(new.org_id, new.webinar_date);
  if tg_op = 'UPDATE' and old.webinar_date is distinct from new.webinar_date then
    perform evergreen_sales_recount(old.org_id, old.webinar_date);
  end if;
  return new;
end $$;

drop trigger if exists evergreen_sales_aiud on evergreen_sales;
create trigger evergreen_sales_aiud
  after insert or update or delete on evergreen_sales
  for each row execute function evergreen_sales_trg();
