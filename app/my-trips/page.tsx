"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBooking } from "../providers";

type SortKey = "date" | "price" | "from" | "to" | "id";

export default function MyTripsPage() {
  const { bookings } = useBooking();
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = !q
      ? bookings
      : bookings.filter((b) =>
          [b.id, b.from, b.to, b.passenger, b.date].some((f) =>
            f.toLowerCase().includes(q)
          )
        );
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [bookings, filter, sortKey, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (!bookings.length) {
    return (
      <div className="card max-w-xl mx-auto">
        <h1 className="text-xl font-semibold">No trips yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          <Link href="/search" className="text-[color:var(--brand-accent)] underline">
            Search flights
          </Link>{" "}
          to book your first trip.
        </p>
      </div>
    );
  }

  const header = (key: SortKey, label: string) => (
    <th
      scope="col"
      className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide cursor-pointer select-none"
      data-sort-key={key}
      onClick={() => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSortKey(key);
          setSortDir("asc");
        }
      }}
    >
      {label}
      {sortKey === key && (
        <span className="ml-1 text-slate-400">{sortDir === "asc" ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">My trips</h1>

      <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
        <input
          type="search"
          placeholder="Filter by route, passenger, date…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="input max-w-md"
          data-testid="trips-filter"
        />
        <div className="text-xs text-slate-500">
          {total} trip{total === 1 ? "" : "s"} found
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm" data-testid="trips-table">
          <thead className="bg-slate-50">
            <tr>
              {header("id", "Reference")}
              {header("from", "From")}
              {header("to", "To")}
              {header("date", "Date")}
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Seat</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Bag</th>
              {header("price", "Price")}
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs">{b.id}</td>
                <td className="px-3 py-2">{b.from}</td>
                <td className="px-3 py-2">{b.to}</td>
                <td className="px-3 py-2">{b.date}</td>
                <td className="px-3 py-2 font-mono text-xs">{b.seat || "—"}</td>
                <td className="px-3 py-2 text-xs">{b.baggage ? "Yes" : "No"}</td>
                <td className="px-3 py-2 font-semibold">${b.price}</td>
              </tr>
            ))}
            {pageSlice.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                  No matching trips
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-slate-500">
          Page {safePage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            data-testid="trips-prev"
          >
            ‹ Prev
          </button>
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            data-testid="trips-next"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
