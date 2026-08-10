-- Migration v3: cancellable bookings — per-row actions on My Trips (issue #1).
-- Run in the Supabase SQL Editor, or via `npm run migrate`.

-- 1) Booking status. Cancel is a soft transition, never a delete: the row must
--    survive so the cancelled state stays assertable after a reload.
alter table public.bookings
  add column if not exists status text not null default 'active';

do $$
begin
  alter table public.bookings
    add constraint bookings_status_check check (status in ('active', 'cancelled'));
exception when duplicate_object then
  null;
end $$;

-- No grants needed here: this migration creates no table, and the
-- `grant all on public.bookings` from 0001 is table-scoped, so it already
-- covers columns added later.

-- 2) Ambiguity fixture. BK-DEMO4 repeats BK-DEMO1's route on a different date
--    and price, mirroring the RegressAir duplication on /results: "the row
--    where To = JFK - New York" now matches 2 rows, so the canon's
--    matchCount === 1 discipline has to disambiguate by a second column.
insert into public.bookings
  (id, user_email, flight_id, from_airport, to_airport, date, passenger, price, created_at, seat, baggage, status)
values
  ('BK-DEMO4', 'demo@sqalogic.ca', 'FL-1001-7', 'YUL - Montreal', 'JFK - New York',
   '2026-09-08', 'Demo User', 415, '2026-04-07T08:20:00Z', '14C', true, 'active')
on conflict (id) do nothing;

-- 3) Keep the seeded fixture pristine. This site is a shared test bed hammered
--    by several engines, so a cancel by any of them must not leave the demo
--    account without an active trip to cancel next time. The local keep-alive
--    task re-runs this same statement every 2 days.
update public.bookings
   set status = 'active'
 where id like 'BK-DEMO%'
   and status <> 'active';
