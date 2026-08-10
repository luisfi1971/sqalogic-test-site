/**
 * Deterministic fixtures for the practice pages.
 *
 * Everything here is a pure function of a fixed seed — no Date.now(), no
 * Math.random() — so the server render and the client hydration agree, and two
 * runs a week apart see byte-identical rows.
 */

const FIRST = ["Ana", "Bruno", "Chloe", "Daniel", "Elif", "Farid", "Grace", "Hugo", "Ines", "Jonas", "Karim", "Lena"];
const LAST = ["Alves", "Bergeron", "Costa", "Dubois", "Eriksen", "Ferreira", "Gagnon", "Haddad", "Ivanov", "Jensen", "Klein", "Lemieux"];
const CITIES = ["Montreal", "Toronto", "New York", "London", "Paris", "Sao Paulo", "Madrid", "Frankfurt", "Lisbon", "Dublin"];
const STATUSES = ["Confirmed", "Pending", "Cancelled", "Checked in"] as const;
const CABINS = ["Economy", "Premium", "Business"] as const;

export type Reservation = {
  ref: string;
  passenger: string;
  from: string;
  to: string;
  date: string;
  cabin: (typeof CABINS)[number];
  status: (typeof STATUSES)[number];
  price: number;
};

function h(n: number, salt: number) {
  return ((n * 2654435761 + salt * 40503) >>> 0) % 1000003;
}

function isoDate(offsetDays: number) {
  // Fixed anchor: 2026-01-05. Never "today" — that would make results drift.
  const d = new Date(Date.UTC(2026, 0, 5) + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

export const RESERVATIONS: Reservation[] = Array.from({ length: 137 }, (_, i) => {
  const a = h(i, 1);
  const b = h(i, 2);
  const c = h(i, 3);
  const from = CITIES[a % CITIES.length];
  const to = CITIES[(b + 3) % CITIES.length];
  return {
    ref: `RSV-${String(1000 + i)}`,
    passenger: `${FIRST[a % FIRST.length]} ${LAST[b % LAST.length]}`,
    from,
    to: to === from ? CITIES[(b + 4) % CITIES.length] : to,
    date: isoDate(i % 180),
    cabin: CABINS[c % CABINS.length],
    status: STATUSES[a % STATUSES.length],
    price: 120 + (c % 1400),
  };
});

/** Airport list used by the typeahead. */
export const AIRPORT_INDEX = [
  "AMS — Amsterdam Schiphol",
  "ATL — Atlanta Hartsfield-Jackson",
  "BCN — Barcelona El Prat",
  "BOS — Boston Logan",
  "BRU — Brussels",
  "CDG — Paris Charles de Gaulle",
  "DUB — Dublin",
  "DXB — Dubai International",
  "FCO — Rome Fiumicino",
  "FRA — Frankfurt am Main",
  "GIG — Rio de Janeiro Galeao",
  "GRU — Sao Paulo Guarulhos",
  "HND — Tokyo Haneda",
  "JFK — New York John F. Kennedy",
  "LAX — Los Angeles",
  "LHR — London Heathrow",
  "LIS — Lisbon Humberto Delgado",
  "MAD — Madrid Barajas",
  "MEX — Mexico City Benito Juarez",
  "MIA — Miami International",
  "ORD — Chicago O'Hare",
  "SFO — San Francisco",
  "SYD — Sydney Kingsford Smith",
  "YQB — Quebec City Jean Lesage",
  "YUL — Montreal Trudeau",
  "YVR — Vancouver",
  "YYC — Calgary",
  "YYZ — Toronto Pearson",
  "ZRH — Zurich",
];

export type FeedItem = {
  id: number;
  title: string;
  route: string;
  price: number;
  seats: number;
};

const FEED_TOTAL = 200;

export function feedPage(offset: number, limit: number): { items: FeedItem[]; total: number } {
  const items: FeedItem[] = [];
  for (let i = offset; i < Math.min(offset + limit, FEED_TOTAL); i++) {
    const a = h(i, 7);
    const b = h(i, 11);
    const from = CITIES[a % CITIES.length];
    const to = CITIES[(b + 5) % CITIES.length];
    items.push({
      id: i + 1,
      title: `Deal #${i + 1}`,
      route: `${from} → ${to === from ? CITIES[(b + 6) % CITIES.length] : to}`,
      price: 89 + (a % 900),
      seats: 1 + (b % 9),
    });
  }
  return { items, total: FEED_TOTAL };
}
