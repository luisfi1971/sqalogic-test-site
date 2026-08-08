"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../providers";

const DEFAULT_FAVOURITES = [
  "YUL - Montreal",
  "YYZ - Toronto",
  "JFK - New York",
  "LHR - London",
  "CDG - Paris",
];

const STORAGE_KEY = "sqa_favourites";

/**
 * Reorderable favourites — the target for the canon's `drag`, which had none.
 *
 * Driven by mouse events rather than the HTML5 drag-and-drop API. That is a
 * deliberate choice: HTML5 DnD needs a real DataTransfer that synthetic events
 * cannot supply, so a native-DnD list is a target most engines can only fail.
 * Mouse-driven reordering is both what modern libraries do and what an engine's
 * dragTo actually drives.
 *
 * The order is persisted, so the result survives a reload and can be asserted
 * after one rather than only in live DOM.
 */
export default function FavouriteAirports() {
  const { t } = useI18n();
  const [items, setItems] = useState<string[]>(DEFAULT_FAVOURITES);
  const [dragging, setDragging] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const draggingRef = useRef<number | null>(null);
  // Mirrors `items` for the document-level mouseup handler, which is bound once
  // and would otherwise close over a stale array.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_FAVOURITES.length &&
        parsed.every((x) => typeof x === "string" && DEFAULT_FAVOURITES.includes(x))
      ) {
        setItems(parsed as string[]);
      }
    } catch {}
  }, []);

  const persist = (next: string[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  useEffect(() => {
    /**
     * Hit-test against the row rectangles rather than relying on mouseenter:
     * synthetic pointer movement does not reliably produce enter/leave pairs,
     * and a list that only reorders under a human hand is not a target.
     */
    const onMove = (e: MouseEvent) => {
      const from = draggingRef.current;
      if (from === null || !listRef.current) return;
      const rows = Array.from(listRef.current.querySelectorAll("li"));
      const over = rows.findIndex((li) => {
        const r = li.getBoundingClientRect();
        return e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (over === -1 || over === from) return;

      setItems((cur) => {
        const next = [...cur];
        const [moved] = next.splice(from, 1);
        next.splice(over, 0, moved);
        return next;
      });
      draggingRef.current = over;
      setDragging(over);
    };

    const onUp = () => {
      if (draggingRef.current === null) return;
      draggingRef.current = null;
      setDragging(null);
      // Persist here rather than inside a state updater: an updater that writes
      // to storage is impure and runs twice under StrictMode.
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsRef.current));
      } catch {}
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div className="card" data-testid="favourites">
      <h2 className="text-sm font-semibold">{t("search.favourites")}</h2>
      <p className="mt-1 text-xs text-slate-500">{t("search.favouritesHint")}</p>
      <ul ref={listRef} className="mt-3 space-y-1" data-testid="favourites-list">
        {items.map((code, i) => (
          <li
            key={code}
            data-fav-airport={code}
            data-fav-index={i}
            data-dragging={dragging === i ? "true" : undefined}
            onMouseDown={() => {
              draggingRef.current = i;
              setDragging(i);
            }}
            className={`flex cursor-grab items-center gap-2 rounded border px-3 py-2 text-sm select-none ${
              dragging === i ? "border-[color:var(--brand-accent)] bg-slate-50" : "border-slate-200"
            }`}
          >
            <span className="text-slate-400">⠿</span>
            <span>{code}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn-ghost mt-3 text-xs"
        data-testid="favourites-reset"
        onClick={() => persist(DEFAULT_FAVOURITES)}
      >
        {t("search.reset")}
      </button>
    </div>
  );
}
