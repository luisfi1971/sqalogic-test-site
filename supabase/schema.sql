-- SQALOGIC Test Site — Supabase schema
-- Paste this entire file into the Supabase SQL Editor and click Run.

-- ============ Tables ============
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);

create table if not exists public.bookings (
  id text primary key,
  user_email text references public.users(email) on delete cascade,
  flight_id text not null,
  from_airport text not null,
  to_airport text not null,
  date text not null,
  passenger text not null,
  price numeric not null,
  created_at timestamptz default now()
);

create index if not exists bookings_user_email_idx on public.bookings(user_email);

-- ============ Row Level Security ============
-- This is a public QA test site. Anonymous clients need full CRUD.
alter table public.users enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "anon all users" on public.users;
create policy "anon all users" on public.users
  for all to anon using (true) with check (true);

drop policy if exists "anon all bookings" on public.bookings;
create policy "anon all bookings" on public.bookings
  for all to anon using (true) with check (true);

-- ============ Seed demo data ============
insert into public.users (name, email, password)
values ('Demo User', 'demo@sqalogic.ca', 'demo123')
on conflict (email) do nothing;

insert into public.bookings (id, user_email, flight_id, from_airport, to_airport, date, passenger, price, created_at) values
  ('BK-DEMO1', 'demo@sqalogic.ca', 'FL-1001-0', 'YUL - Montreal',    'JFK - New York', '2026-05-01', 'Demo User', 320,  '2026-04-01T12:00:00Z'),
  ('BK-DEMO2', 'demo@sqalogic.ca', 'FL-1001-2', 'YYZ - Toronto',     'LHR - London',   '2026-06-14', 'Demo User', 890,  '2026-04-03T09:30:00Z'),
  ('BK-DEMO3', 'demo@sqalogic.ca', 'FL-1001-3', 'GRU - Sao Paulo',   'CDG - Paris',    '2026-07-22', 'Demo User', 1240, '2026-04-05T15:10:00Z')
on conflict (id) do nothing;
