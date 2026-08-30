-- 006: atomične ingest funkcije za DM metrike (poziva ih webhook ruta preko RPC-a
-- sa service-role ključem). Drže brojanje u bazi (bez race-condition read-modify-write)
-- i garantuju idempotentnost preko dedup-a u dm_events.
--
-- Primeniti preko pg runner-a (scripts/migrate-dm.mjs) — NE preko Supabase SQL
-- editora (njegov splitter lomi više plpgsql funkcija u jednom query-ju).

-- Poruka: dedup po mid, pa bump dnevnih brojača + kvalifikacija konverzacije.
create or replace function dm_apply_message(
  p_org uuid,
  p_mid text,
  p_thread text,
  p_occurred timestamptz,
  p_direction text,
  p_has_booking boolean,
  p_has_payment boolean,
  p_raw jsonb
) returns void as $$
declare
  v_day date := (p_occurred at time zone 'Europe/Belgrade')::date;
  v_inserted int;
  v_was_qual boolean;
  v_count int;
begin
  insert into dm_events (org_id, source, external_id, kind, direction, thread_id,
                         has_booking_link, has_payment_link, occurred_at, day, raw_data)
  values (p_org, 'instagram', p_mid, 'message', p_direction, p_thread,
          coalesce(p_has_booking, false), coalesce(p_has_payment, false),
          p_occurred, v_day, coalesce(p_raw, '{}'::jsonb))
  on conflict (org_id, source, external_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return; -- već obrađeno (duplikat webhooka) → ne broji ponovo
  end if;

  insert into dm_daily (org_id, day) values (p_org, v_day)
  on conflict (org_id, day) do nothing;

  update dm_daily set
    outbound      = outbound      + (case when p_direction = 'out' then 1 else 0 end),
    inbound       = inbound       + (case when p_direction = 'in'  then 1 else 0 end),
    booking_links = booking_links + (case when p_direction = 'out' and coalesce(p_has_booking,false) then 1 else 0 end),
    payment_links = payment_links + (case when p_direction = 'out' and coalesce(p_has_payment,false) then 1 else 0 end),
    updated_at    = now()
  where org_id = p_org and day = v_day;

  -- brojač poruka po konverzaciji + kvalifikacija (>2 poruke, jednom)
  if p_thread is not null and p_thread <> '' then
    insert into dm_threads (org_id, thread_id, msg_count, qualified, first_at, last_at)
    values (p_org, p_thread, 1, false, p_occurred, p_occurred)
    on conflict (org_id, thread_id) do update
      set msg_count = dm_threads.msg_count + 1,
          last_at   = greatest(dm_threads.last_at, excluded.last_at),
          first_at  = least(dm_threads.first_at, excluded.first_at)
    returning qualified, msg_count into v_was_qual, v_count;

    if (not v_was_qual) and v_count > 2 then
      update dm_threads set qualified = true, qualified_day = v_day
        where org_id = p_org and thread_id = p_thread;
      insert into dm_daily (org_id, day) values (p_org, v_day)
        on conflict (org_id, day) do nothing;
      update dm_daily set conversations = conversations + 1, updated_at = now()
        where org_id = p_org and day = v_day;
    end if;
  end if;
end;
$$ language plpgsql;

-- Konverzija (zakazan poziv / kupovina): dedup po external_id, pa bump dana.
create or replace function dm_apply_conversion(
  p_org uuid,
  p_source text,
  p_external_id text,
  p_kind text,
  p_occurred timestamptz,
  p_amount numeric,
  p_currency text,
  p_attributed boolean,
  p_raw jsonb
) returns void as $$
declare
  v_day date := (p_occurred at time zone 'Europe/Belgrade')::date;
  v_inserted int;
begin
  insert into dm_events (org_id, source, external_id, kind, attributed,
                         amount, currency, occurred_at, day, raw_data)
  values (p_org, p_source, p_external_id, p_kind, coalesce(p_attributed, true),
          coalesce(p_amount, 0), coalesce(p_currency, 'EUR'),
          p_occurred, v_day, coalesce(p_raw, '{}'::jsonb))
  on conflict (org_id, source, external_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return;
  end if;

  insert into dm_daily (org_id, day) values (p_org, v_day)
  on conflict (org_id, day) do nothing;

  update dm_daily set
    appointments = appointments + (case when p_kind = 'appointment' then 1 else 0 end),
    purchases    = purchases    + (case when p_kind = 'purchase' then 1 else 0 end),
    revenue      = revenue      + (case when p_kind = 'purchase' then coalesce(p_amount, 0) else 0 end),
    currency     = coalesce(p_currency, currency),
    updated_at   = now()
  where org_id = p_org and day = v_day;
end;
$$ language plpgsql;
