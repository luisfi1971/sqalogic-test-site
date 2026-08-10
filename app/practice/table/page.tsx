"use client";

import { useMemo, useState } from "react";
import { RESERVATIONS, type Reservation } from "../data";

type SortKey = keyof Reservation;

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "ref", label: "Reference" },
  { key: "passenger", label: "Passenger" },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "date", label: "Date" },
  { key: "cabin", label: "Cabin" },
  { key: "status", label: "Status" },
  { key: "price", label: "Price", numeric: true },
];

const PAGE_SIZES = [10, 25, 50];

export default function ReservationsTablePage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ref");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? RESERVATIONS.filter((r) =>
          [r.ref, r.passenger, r.from, r.to, r.date, r.cabin, r.status].some((f) =>
            f.toLowerCase().includes(q)
          )
        )
      : RESERVATIONS;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const cellPad = density === "compact" ? "px-3 py-1" : "px-3 py-2";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reservations</h1>
      <p className="mt-2 text-sm text-slate-600">
        {RESERVATIONS.length} reservations. Sort by clicking a column header, narrow the
        list with the filter, and page through the results.
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor="rsv-filter" className="label">
            Filter reservations
          </label>
          <input
            id="rsv-filter"
            type="search"
            className="input max-w-md"
            placeholder="Reference, passenger, city, status…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            data-testid="table-filter"
          />
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label htmlFor="rsv-page-size" className="label">
              Rows per page
            </label>
            <select
              id="rsv-page-size"
              className="input"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              data-testid="table-page-size"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/*
            DELIBERATE HARD CASE — the single unlabelled control on this site.
            Icon-only, no aria-label, no title, no text: its accessible name is
            empty. It toggles row density. Documented in docs/TEST-CONTROLS.md.
          */}
          <button
            type="button"
            className="btn-ghost px-3"
            data-control="density"
            onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
          >
            <span aria-hidden="true">≡</span>
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500" data-testid="table-summary" aria-live="polite">
        Showing {rows.length} of {filtered.length} matching reservations
      </p>

      <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm" data-testid="reservations-table">
          <caption className="sr-only">Reservations, sortable and filterable</caption>
          <thead className="bg-slate-50">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`${c.numeric ? "text-right" : "text-left"} px-3 py-2`}
                  aria-sort={
                    sortKey === c.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
                    onClick={() => toggleSort(c.key)}
                    data-sort-key={c.key}
                  >
                    {c.label}
                    <span className="ml-1 text-slate-400" aria-hidden="true">
                      {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref} className="border-t border-slate-100 hover:bg-slate-50">
                <td className={`${cellPad} font-mono text-xs`}>{r.ref}</td>
                <td className={cellPad}>{r.passenger}</td>
                <td className={cellPad}>{r.from}</td>
                <td className={cellPad}>{r.to}</td>
                <td className={cellPad}>{r.date}</td>
                <td className={cellPad}>{r.cabin}</td>
                <td className={cellPad}>{r.status}</td>
                <td className={`${cellPad} text-right font-semibold`}>${r.price}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-slate-500">
                  No reservations match “{query}”
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav className="mt-3 flex items-center justify-between text-sm" aria-label="Pagination">
        <div className="text-slate-500" data-testid="table-page-indicator">
          Page {safePage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage(1)}
          >
            « First
          </button>
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Previous
          </button>
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next ›
          </button>
          <button
            type="button"
            className="btn-ghost disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setPage(totalPages)}
          >
            Last »
          </button>
        </div>
      </nav>
    </div>
  );
}
