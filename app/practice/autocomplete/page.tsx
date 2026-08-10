"use client";

import { useEffect, useRef, useState } from "react";
import { AIRPORT_INDEX } from "../data";

const LOOKUP_MS = 300;

export default function AutocompletePage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [chosen, setChosen] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced "async" lookup. Deliberately a real timer so the suggestions are
  // genuinely late — this is what makes a typeahead worth automating.
  // The effect body itself never calls setState synchronously; the open/loading
  // flip happens in the change handler, the results land in the timer callback.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      setSuggestions(AIRPORT_INDEX.filter((a) => a.toLowerCase().includes(q)).slice(0, 8));
      setActive(-1);
      setLoading(false);
    }, LOOKUP_MS);
    return () => clearTimeout(t);
  }, [query]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    setChosen(null);
    if (value.trim().length < 2) {
      setOpen(false);
      setLoading(false);
      setSuggestions([]);
      setActive(-1);
    } else {
      setOpen(true);
      setLoading(true);
    }
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (value: string) => {
    setChosen(value);
    setQuery(value);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && suggestions.length) setOpen(true);
      setActive((i) => (suggestions.length ? (i + 1) % suggestions.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        suggestions.length ? (i <= 0 ? suggestions.length - 1 : i - 1) : -1
      );
    } else if (e.key === "Enter") {
      if (open && active >= 0 && suggestions[active]) {
        e.preventDefault();
        pick(suggestions[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Airport lookup</h1>
      <p className="mt-2 text-sm text-slate-600">
        Type at least two characters. Suggestions arrive about {LOOKUP_MS}ms later. Arrow
        keys move the highlight, Enter selects, Escape closes.
      </p>

      <div className="card mt-6">
        <label htmlFor="ac-input" className="label">
          Destination airport
        </label>
        <div className="relative" ref={boxRef}>
          <input
            id="ac-input"
            className="input"
            role="combobox"
            aria-expanded={open}
            aria-controls="ac-listbox"
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `ac-option-${active}` : undefined}
            autoComplete="off"
            placeholder="e.g. lis, heathrow, YUL"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            data-testid="autocomplete-input"
          />

          {open && (
            <div
              id="ac-listbox"
              role="listbox"
              aria-label="Airport suggestions"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
              data-testid="autocomplete-listbox"
            >
              {loading && (
                <div className="px-3 py-2 text-sm text-slate-500" data-testid="autocomplete-loading">
                  Searching…
                </div>
              )}
              {!loading && suggestions.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500" data-testid="autocomplete-empty">
                  No airports match “{query.trim()}”
                </div>
              )}
              {!loading &&
                suggestions.map((s, i) => (
                  <div
                    key={s}
                    id={`ac-option-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      i === active ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s)}
                  >
                    {s}
                  </div>
                ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-sm" aria-live="polite" data-testid="autocomplete-selection">
          {chosen ? (
            <>
              Selected: <span className="font-semibold">{chosen}</span>
            </>
          ) : (
            "No airport selected yet."
          )}
        </p>
      </div>
    </div>
  );
}
