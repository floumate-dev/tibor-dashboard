-- 004: Evergreen webinar attendance metrics (daily simulated-live webinar @20:00).
--
-- Two tables:
--   evergreen_attendees  — one row per registrant per day (raw, re-segmentable,
--                          drill-down + conversion matching by email).
--   evergreen_webinars   — one row per webinar day (precomputed aggregate for
--                          fast dashboard reads + trends).
--
-- Segments are clock/watch-depth based ("present at X" = join <= X <= join+watch)
-- and thresholds are TIED TO THE RECORDING, so each day stores the thresholds
-- used. Backfilled from AEvent registrant CSVs; future days via AEvent webhook.
-- Reads go through server routes using the service-role key (RLS bypassed),
-- same pattern as the sales `calls` table — so RLS is enabled with no public
-- policies (anon denied, service role only).

create table if not exists evergreen_attendees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  webinar_date date not null,
  email text not null,
  phone text,
  attended boolean not null default false,
  join_min numeric,                       -- minute-of-day of join (Europe/Belgrade), null if no join
  watch_min numeric not null default 0,   -- total attendance, minutes
  segment smallint not null,              -- 1 no-show · 2 <pitch · 3 reached-pitch · 4 full-pitch
  bought boolean not null default false,  -- matched to GHL bought_eun (filled in a later pass)
  created_at timestamptz default now(),
  unique (org_id, webinar_date, email)
);

create index if not exists idx_evg_att_org_date on evergreen_attendees(org_id, webinar_date);
create index if not exists idx_evg_att_segment on evergreen_attendees(org_id, webinar_date, segment);

create table if not exists evergreen_webinars (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  webinar_date date not null,
  recording_label text,
  pitch_start_min numeric,                -- threshold used for this day (minute-of-day)
  full_pitch_min numeric,
  registrants int not null default 0,
  attendees int not null default 0,
  seg_no_show int not null default 0,
  seg_before_pitch int not null default 0,
  seg_reached_pitch int not null default 0,
  seg_full_pitch int not null default 0,
  conversions int not null default 0,
  sources jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique (org_id, webinar_date)
);

create index if not exists idx_evg_web_org_date on evergreen_webinars(org_id, webinar_date desc);

alter table evergreen_attendees enable row level security;
alter table evergreen_webinars enable row level security;
