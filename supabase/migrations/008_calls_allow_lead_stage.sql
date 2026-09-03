-- 008: allow 'lead' as a calls.stage.
-- The Sales dashboard (data.ts Stage + stats) treats stage 'lead' as a
-- top-of-funnel lead (counted separately from booked calls), but the original
-- CHECK omitted it, so lead rows couldn't be stored. Sales calls are now rebuilt
-- from iClosed where most contacts are leads (not yet booked), so allow it.
alter table calls drop constraint if exists calls_stage_check;
alter table calls add constraint calls_stage_check
  check (stage in ('lead','scheduled','showed_up','won','lost','no_show'));
