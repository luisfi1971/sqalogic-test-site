-- Migration v4: enough seeded trips for pagination to be real (issue #6, item 6).
-- My Trips shows 5 rows per page and said "Page 1 of 1" with 4 trips, so
-- `table.paginate` was never exercised. Thirteen trips gives three pages.
--
-- Every new trip is dated BEFORE the original four on purpose. The table sorts
-- by date descending by default, so BK-DEMO1..4 stay on page 1 and the suites
-- that address them by reference keep working; the new rows fill pages 2 and 3.

insert into public.bookings
  (id, user_email, flight_id, from_airport, to_airport, date, passenger, price, created_at, seat, baggage, status)
values
  ('BK-DEMO5',  'demo@sqalogic.ca', 'FL-2001-1', 'YUL - Montreal',   'LAX - Los Angeles', '2026-04-28', 'Demo User', 505,  '2026-03-01T09:00:00Z', '9A',  false, 'active'),
  ('BK-DEMO6',  'demo@sqalogic.ca', 'FL-2001-2', 'YYZ - Toronto',    'MAD - Madrid',      '2026-04-19', 'Demo User', 760,  '2026-03-02T09:00:00Z', '3C',  true,  'active'),
  ('BK-DEMO7',  'demo@sqalogic.ca', 'FL-2001-3', 'GIG - Rio de Janeiro', 'FRA - Frankfurt', '2026-04-11', 'Demo User', 1180, '2026-03-03T09:00:00Z', '22F', false, 'active'),
  ('BK-DEMO8',  'demo@sqalogic.ca', 'FL-2001-4', 'JFK - New York',   'LHR - London',      '2026-04-02', 'Demo User', 640,  '2026-03-04T09:00:00Z', '7D',  true,  'active'),
  ('BK-DEMO9',  'demo@sqalogic.ca', 'FL-2001-5', 'CDG - Paris',      'GRU - Sao Paulo',   '2026-03-25', 'Demo User', 1310, '2026-03-05T09:00:00Z', '11B', false, 'active'),
  ('BK-DEMO10', 'demo@sqalogic.ca', 'FL-2001-6', 'LAX - Los Angeles','YUL - Montreal',    '2026-03-17', 'Demo User', 480,  '2026-03-06T09:00:00Z', '18A', false, 'active'),
  ('BK-DEMO11', 'demo@sqalogic.ca', 'FL-2001-7', 'MAD - Madrid',     'YYZ - Toronto',     '2026-03-08', 'Demo User', 815,  '2026-03-07T09:00:00Z', '5E',  true,  'active'),
  ('BK-DEMO12', 'demo@sqalogic.ca', 'FL-2001-8', 'FRA - Frankfurt',  'GIG - Rio de Janeiro', '2026-02-27', 'Demo User', 1090, '2026-03-08T09:00:00Z', '14C', false, 'active'),
  ('BK-DEMO13', 'demo@sqalogic.ca', 'FL-2001-9', 'LHR - London',     'JFK - New York',    '2026-02-15', 'Demo User', 690,  '2026-03-09T09:00:00Z', '2A',  true,  'active')
on conflict (id) do nothing;
