"use client";

import { useEffect, useRef, useState } from "react";

/*
 * SORT BY LISTENER — a stable test-bed page for a header the page sorts with
 * and marks in no way (SQALOGIC TestHub, branch fix-header-act, 2026-10-30;
 * the class the-internet /tables exposed: jQuery tablesorter binds a click
 * handler on each <th>).
 *
 * Two tables with the SAME headers, so only the table each header row sits in
 * tells them apart. In the first, each header cell gets a native click
 * listener (addEventListener, bound after render) and sorts its table by that
 * column. The header cells carry no role, no tabindex, no onclick attribute,
 * no button inside and no pointer cursor: nothing in the markup says they can
 * be pressed — only the registered listener does. The second table's headers
 * have no listener at all, and pressing them does nothing.
 *
 * Nothing is stored; a reload starts over.
 */
type Flight = { flight: string; from: string; fare: number };
const FLIGHTS: Flight[] = [
  { flight: "AC120", from: "YUL", fare: 320 },
  { flight: "AC018", from: "YYZ", fare: 145 },
  { flight: "AC305", from: "YVR", fare: 510 },
];
const COLUMNS: { key: keyof Flight; label: string }[] = [
  { key: "flight", label: "Flight" },
  { key: "from", label: "From" },
  { key: "fare", label: "Fare" },
];

export default function SortByListenerPage() {
  const [sortKey, setSortKey] = useState<keyof Flight | null>(null);
  const headRow = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    const row = headRow.current;
    if (!row) return;
    const cells = Array.from(row.querySelectorAll("th"));
    const handlers = cells.map((th, i) => {
      const handler = () => setSortKey(COLUMNS[i].key);
      th.addEventListener("click", handler);
      return { th, handler };
    });
    return () => {
      for (const { th, handler } of handlers) th.removeEventListener("click", handler);
    };
  }, []);

  const sorted = [...FLIGHTS].sort((a, b) => {
    if (!sortKey) return 0;
    const x = a[sortKey];
    const y = b[sortKey];
    return x < y ? -1 : x > y ? 1 : 0;
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Sort by listener</h1>
      <p className="mt-2 text-sm">Click a header of the first table to sort it. The second table does not sort.</p>

      <h2 className="mt-6 text-lg font-medium">Departures</h2>
      <table id="departures" className="mt-2 w-full border-collapse">
        <thead>
          <tr ref={headRow}>
            {COLUMNS.map((c) => (
              <th key={c.key} className="border px-2 py-1 text-left">
                <span>{c.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((f) => (
            <tr key={f.flight}>
              <td className="border px-2 py-1">{f.flight}</td>
              <td className="border px-2 py-1">{f.from}</td>
              <td className="border px-2 py-1">{f.fare}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p data-testid="departures-sorted-by" className="mt-1 text-sm">
        {sortKey ? `Sorted by ${COLUMNS.find((c) => c.key === sortKey)?.label}` : "Not sorted"}
      </p>

      <h2 className="mt-6 text-lg font-medium">Arrivals</h2>
      <table id="arrivals" className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className="border px-2 py-1 text-left">
                <span>{c.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FLIGHTS.map((f) => (
            <tr key={f.flight}>
              <td className="border px-2 py-1">{f.flight}</td>
              <td className="border px-2 py-1">{f.from}</td>
              <td className="border px-2 py-1">{f.fare}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
