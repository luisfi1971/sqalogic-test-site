-- Migration v2: seat/baggage, global release counter, hashed demo password.
-- Run in the Supabase SQL Editor.

-- 1) Add seat + baggage columns to bookings
alter table public.bookings add column if not exists seat text;
alter table public.bookings add column if not exists baggage boolean default false;

-- 2) Global release counter (single row)
create table if not exists public.release_state (
  id int primary key default 1,
  release int not null default 1,
  updated_at timestamptz default now(),
  constraint release_single_row check (id = 1)
);
alter table public.release_state enable row level security;
drop policy if exists "anon all release" on public.release_state;
create policy "anon all release" on public.release_state
  for all to anon using (true) with check (true);
insert into public.release_state (id, release) values (1, 1) on conflict (id) do nothing;

-- 3) Enable realtime on release_state (idempotent)
do $$
begin
  alter publication supabase_realtime add table public.release_state;
exception when duplicate_object then
  null;
end $$;

-- 4) Rehash demo user password (SHA-256 of "demo123")
update public.users
  set password = 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791'
  where email = 'demo@sqalogic.ca';
