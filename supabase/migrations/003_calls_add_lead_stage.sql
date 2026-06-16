-- Add "lead" to the allowed call stages. GHL Sales Pipeline added a "Lead"
-- stage = lead awaiting call scheduling (NOT a booked call), tracked separately
-- from "scheduled". The original 002 CHECK didn't include it, so writes with
-- stage='lead' fail the constraint.
alter table calls drop constraint if exists calls_stage_check;
alter table calls add constraint calls_stage_check
  check (stage in ('lead', 'scheduled', 'showed_up', 'won', 'lost', 'no_show'));
