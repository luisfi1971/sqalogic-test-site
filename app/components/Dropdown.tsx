"use client";

import { useEffect, useRef, useState } from "react";

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select…",
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref} data-testid="custom-dropdown" data-dropdown-label={label}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input cursor-pointer flex items-center justify-between"
      >
        <span className={value ? "" : "text-slate-400"}>{value || placeholder}</span>
        <span className="text-slate-400">▾</span>
      </div>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto"
        >
          <input
            autoFocus
            placeholder="Filter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b border-slate-200 px-3 py-2 text-sm outline-none"
          />
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          )}
          {filtered.map((o) => (
            <div
              key={o}
              role="option"
              aria-selected={o === value}
              data-value={o}
              onClick={() => {
                onChange(o);
                setOpen(false);
                setQuery("");
              }}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 ${
                o === value ? "bg-slate-50 font-medium" : ""
              }`}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
