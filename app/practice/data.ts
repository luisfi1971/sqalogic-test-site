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

/* ------------------------------------------------------------------ *
 * ACCOUNTS RECEIVABLE — fixtures for the MARKED ROW ACTION archetype.
 *
 * Every other repeated element on this site tells its rows apart by what they
 * SHOW: seat labels differ, flight times differ, deal titles differ. That is
 * the unusual case. In most business software the row action reads the same on
 * every row — "View" on every invoice, "Remind" on every overdue account — and
 * the only thing separating one row's control from another's is the mark the
 * developer put on it.
 *
 * The three lists below are that case and its boundary, deliberately:
 *
 *   INVOICES   marked with `data-testid`     — the conventional mark, and the
 *                                              rarest one in the wild: a
 *                                              testid only exists where
 *                                              somebody wrote tests first
 *   REMINDERS  marked with `data-invoice-id` — a mark that is NOT a testid,
 *                                              which is how most applications
 *                                              actually key a row
 *   RECEIPTS   not marked at all             — and legitimately: an
 *                                              unallocated receipt has no
 *                                              invoice to key it by yet, which
 *                                              is the whole reason it sits in
 *                                              this list
 * ------------------------------------------------------------------ */

const COMPANIES = [
  "Northwind Foods",
  "Aurora Dental",
  "Beaumont & Kerr",
  "Cedarline Logistics",
  "Delta Print Works",
  "Everly Interiors",
  "Foxbridge Legal",
  "Granite Roofing",
  "Halcyon Media",
  "Ironvale Metals",
  "Juniper Clinics",
  "Kestrel Marine",
];

const METHODS = ["Wire", "Cheque", "Card", "Direct debit"] as const;
const INVOICE_STATES = ["Sent", "Overdue", "Part paid"] as const;

export type Invoice = {
  /** INV-2041 … INV-2052. What the row's own control is marked with. */
  ref: string;
  customer: string;
  issued: string;
  due: string;
  amount: number;
  state: (typeof INVOICE_STATES)[number];
};

export const INVOICES: Invoice[] = Array.from({ length: 12 }, (_, i) => {
  const a = h(i, 21);
  const b = h(i, 22);
  return {
    ref: `INV-${2041 + i}`,
    customer: COMPANIES[a % COMPANIES.length],
    issued: isoDate(i * 3),
    due: isoDate(i * 3 + 30),
    amount: 480 + (b % 9400),
    state: INVOICE_STATES[a % INVOICE_STATES.length],
  };
});

export type Reminder = {
  /** INV-3155 … INV-3165. Carried on the row's control as `data-invoice-id`. */
  ref: string;
  customer: string;
  daysLate: number;
  amount: number;
};

export const REMINDERS: Reminder[] = Array.from({ length: 11 }, (_, i) => {
  const a = h(i, 31);
  const b = h(i, 32);
  return {
    ref: `INV-${3155 + i}`,
    customer: COMPANIES[(a + 5) % COMPANIES.length],
    daysLate: 4 + (b % 90),
    amount: 260 + (a % 6100),
  };
});

export type Receipt = {
  received: string;
  payer: string;
  amount: number;
  method: (typeof METHODS)[number];
};

export const RECEIPTS: Receipt[] = Array.from({ length: 10 }, (_, i) => {
  const a = h(i, 41);
  const b = h(i, 42);
  return {
    received: isoDate(120 + i * 2),
    payer: `${FIRST[a % FIRST.length]} ${LAST[b % LAST.length]}`,
    amount: 95 + (b % 1800),
    method: METHODS[a % METHODS.length],
  };
});
