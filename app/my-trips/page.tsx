"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBooking, useRelease, useToast, type Booking } from "../providers";
import ConfirmModal from "../components/ConfirmModal";

type SortKey = "date" | "price" | "from" | "to" | "id";

/**
 * Row controls deliberately share one hook across every row, so selecting by it
 * alone is ambiguous and a real row-where is required. The DOM id is still made
 * unique per row to keep the document valid.
 */
function rowAttrs(base: Record<string, string | undefined>, rowId: string) {
  const out = { ...base };
  if (out.id) out.id = `${out.id}_${rowId}`;
  return out;
}

export default function MyTripsPage() {
  const { bookings, cancelBooking } = useBooking();
  const { attrs, release } = useRelease();
  const { toast } = useToast();
  const [detailsOf, setDetailsOf] = useState<Booking | null>(null);
  const [confirmOf, setConfirmOf] = useState<Booking | null>(null);
  // Selection is keyed by booking reference, never by row index, so it survives
  // sorting, filtering and paging. That is the documented behaviour the canon
  // asks for: deterministic either way, but stated.
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
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

  // Only active trips are selectable — a cancelled one has nothing left to do.
  const selectableOnPage = pageSlice.filter((b) => b.status !== "cancelled").map((b) => b.id);
  const selectedOnPage = selectableOnPage.filter((id) => selected.includes(id));
  const allOnPageSelected =
    selectableOnPage.length > 0 && selectedOnPage.length === selectableOnPage.length;

  const toggleRow = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // Select-all covers the current page only, which is what the checkbox can
  // honestly claim when the rest of the selection is off-screen.
  const toggleAllOnPage = () =>
    setSelected((cur) =>
      allOnPageSelected
        ? cur.filter((id) => !selectableOnPage.includes(id))
        : [...cur, ...selectableOnPage.filter((id) => !cur.includes(id))]
    );

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

      <div className="mt-3 flex items-center gap-3" data-testid="trips-bulk-bar">
        <button
          type="button"
          className="btn-primary text-sm disabled:opacity-40"
          disabled={selected.length === 0}
          onClick={() => setBulkOpen(true)}
          data-testid="trips-cancel-selected"
        >
          Cancel selected
        </button>
        <span className="text-xs text-slate-500" data-testid="trips-selection-count">
          {selected.length} selected
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm" data-testid="trips-table">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left" data-col="select">
                <input
                  type="checkbox"
                  aria-label="Select all trips on this page"
                  data-testid="trips-select-all"
                  checked={allOnPageSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        selectedOnPage.length > 0 && !allOnPageSelected;
                    }
                  }}
                  disabled={selectableOnPage.length === 0}
                  onChange={toggleAllOnPage}
                />
              </th>
              {header("id", "Reference")}
              {header("from", "From")}
              {header("to", "To")}
              {header("date", "Date")}
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Seat</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Bag</th>
              {header("price", "Price")}
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((b) => {
              const cancelled = b.status === "cancelled";
              return (
                <tr
                  key={b.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                  data-selected={selected.includes(b.id) ? "true" : undefined}
                >
                  <td className="px-3 py-2" data-col="select">
                    <input
                      type="checkbox"
                      aria-label={`Select trip ${b.id}`}
                      data-testid="trip-select"
                      checked={selected.includes(b.id)}
                      disabled={cancelled}
                      onChange={() => toggleRow(b.id)}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" data-col="reference">{b.id}</td>
                  <td className="px-3 py-2" data-col="from">{b.from}</td>
                  <td className="px-3 py-2" data-col="to">{b.to}</td>
                  <td className="px-3 py-2" data-col="date">{b.date}</td>
                  <td className="px-3 py-2 font-mono text-xs" data-col="seat">{b.seat || "—"}</td>
                  <td className="px-3 py-2 text-xs" data-col="bag">{b.baggage ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 font-semibold" data-col="price">${b.price}</td>
                  <td className="px-3 py-2" data-col="status">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        cancelled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {cancelled ? "Cancelled" : "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-2" data-col="actions">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => setDetailsOf(b)}
                        {...rowAttrs(attrs("trip-view"), b.id)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-xs text-red-600 disabled:opacity-40"
                        disabled={cancelled}
                        onClick={() => setConfirmOf(b)}
                        {...rowAttrs(attrs("trip-cancel"), b.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pageSlice.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-slate-500">
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

      <ConfirmModal
        open={bulkOpen}
        title={`Cancel ${selected.length} selected trip${selected.length === 1 ? "" : "s"}?`}
        testId="bulk-cancel-modal"
        confirmLabel="Cancel them"
        cancelLabel="Keep them"
        delayMs={release >= 2 ? 400 : 0}
        onConfirm={async () => {
          const ids = selected;
          setBulkOpen(false);
          setSelected([]);
          for (const id of ids) await cancelBooking(id);
          toast(`${ids.length} trip${ids.length === 1 ? "" : "s"} cancelled`, "info");
        }}
        onCancel={() => setBulkOpen(false)}
      >
        <div>
          <p>These trips will be cancelled:</p>
          <ul className="mt-2 list-disc pl-5 font-mono text-xs" data-testid="bulk-cancel-list">
            {selected.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={!!detailsOf}
        title={`Trip ${detailsOf?.id ?? ""}`}
        testId="trip-details-modal"
        hideConfirm
        cancelLabel="Close"
        onConfirm={() => setDetailsOf(null)}
        onCancel={() => setDetailsOf(null)}
      >
        {detailsOf && (
          <dl className="grid grid-cols-2 gap-y-2">
            <dt className="text-slate-500">Reference</dt>
            <dd className="font-mono text-xs">{detailsOf.id}</dd>
            <dt className="text-slate-500">Route</dt>
            <dd>
              {detailsOf.from} → {detailsOf.to}
            </dd>
            <dt className="text-slate-500">Date</dt>
            <dd>{detailsOf.date}</dd>
            <dt className="text-slate-500">Passenger</dt>
            <dd>{detailsOf.passenger}</dd>
            <dt className="text-slate-500">Seat</dt>
            <dd className="font-mono text-xs">{detailsOf.seat || "—"}</dd>
            <dt className="text-slate-500">Checked bag</dt>
            <dd>{detailsOf.baggage ? "Yes" : "No"}</dd>
            <dt className="text-slate-500">Price</dt>
            <dd className="font-semibold">${detailsOf.price}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd>{detailsOf.status === "cancelled" ? "Cancelled" : "Active"}</dd>
          </dl>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={!!confirmOf}
        title="Cancel this trip?"
        confirmLabel="Cancel trip"
        cancelLabel="Keep trip"
        delayMs={release >= 2 ? 400 : 0}
        onConfirm={async () => {
          const target = confirmOf;
          setConfirmOf(null);
          if (target) {
            await cancelBooking(target.id);
            toast(`Trip ${target.id} cancelled`, "info");
          }
        }}
        onCancel={() => setConfirmOf(null)}
      >
        {confirmOf && (
          <p>
            Trip <strong className="font-mono">{confirmOf.id}</strong> from{" "}
            <strong>{confirmOf.from}</strong> to <strong>{confirmOf.to}</strong> on{" "}
            <strong>{confirmOf.date}</strong> will be cancelled. This cannot be undone from
            here.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}
