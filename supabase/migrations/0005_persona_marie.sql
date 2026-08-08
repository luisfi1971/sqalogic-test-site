-- Migration v5: a second persona (issue #6, item 10).
--
-- Personas give the canon its shared-dataset target: the same flows run against
-- different data, so a suite that quietly depends on one account's rows fails
-- instead of passing by luck. Marie's set is deliberately a different shape —
-- fewer trips, one already cancelled, and a French-Canadian name whose accents
-- exercise the e-ticket's ASCII folding.

insert into public.users (name, email, password)
values ('Marie Tremblay', 'marie@sqalogic.ca',
        'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791')
on conflict (email) do nothing;

insert into public.bookings
  (id, user_email, flight_id, from_airport, to_airport, date, passenger, price, created_at, seat, baggage, status)
values
  ('BK-MARIE1', 'marie@sqalogic.ca', 'FL-3001-1', 'YUL - Montreal', 'CDG - Paris',
   '2026-06-02', 'Marie Tremblay', 985, '2026-04-02T10:00:00Z', '4A', true,  'active'),
  ('BK-MARIE2', 'marie@sqalogic.ca', 'FL-3001-2', 'YUL - Montreal', 'GIG - Rio de Janeiro',
   '2026-08-19', 'Marie Tremblay', 1425, '2026-04-03T10:00:00Z', '16D', false, 'active'),
  -- Already cancelled, so a suite meets a non-selectable row without having to
  -- create one and leave the fixture dirty.
  ('BK-MARIE3', 'marie@sqalogic.ca', 'FL-3001-3', 'YYZ - Toronto',  'MAD - Madrid',
   '2026-05-11', 'Marie Tremblay', 720,  '2026-04-04T10:00:00Z', '21C', false, 'cancelled')
on conflict (id) do nothing;
