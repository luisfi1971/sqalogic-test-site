"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseIso(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function Calendar({
  value,
  onChange,
  label = "Date",
}: {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => parseIso(value) || new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = parseIso(value);
    if (v) setCursor(v);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const selected = parseIso(value);
  const isSelected = (d: number) =>
    !!selected &&
    selected.getFullYear() === year &&
    selected.getMonth() === month &&
    selected.getDate() === d;

  const displayValue = selected
    ? `${MONTHS[selected.getMonth()].slice(0, 3)} ${selected.getDate()}, ${selected.getFullYear()}`
    : "Pick a date";

  return (
    <div className="relative" ref={ref} data-testid="custom-calendar">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
      >
        {displayValue}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Date picker"
          className="absolute z-20 mt-1 w-72 rounded-md border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-slate-100"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <div className="text-sm font-semibold">
              {MONTHS[month]} {year}
            </div>
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-slate-100"
              aria-label="Next month"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wide text-slate-500 mb-1">
            {DOW.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) =>
              d === null ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(fmt(new Date(year, month, d)));
                    setOpen(false);
                  }}
                  data-day={d}
                  data-iso={fmt(new Date(year, month, d))}
                  className={`h-8 rounded text-sm transition ${
                    isSelected(d)
                      ? "bg-[color:var(--brand-accent)] text-white"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {d}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
