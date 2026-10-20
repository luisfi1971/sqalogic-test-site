"use client";

import { useState } from "react";

/*
 * A page whose state a story CHECKS, CHANGES and CHECKS AGAIN (SQALOGIC
 * TestHub 80fc6a18): the counter is on the page from the first render — it
 * reads "0 items packed" before anything is added — so «the counter reads 0 ·
 * add "Passport" · the counter reads 1» is checkable at every step. Add is a
 * click (not Enter), and the box is cleared by it. Nothing is stored; a reload
 * starts at 0.
 */
export default function PackingListPage() {
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    setItems((all) => [...all, name]);
    setDraft("");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Packing list</h1>
      <p className="mt-2 text-sm text-slate-600">
        Add what you are taking. The counter is always shown, starting at zero.
      </p>
      <form
        className="mt-4 flex max-w-md items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div className="flex-1">
          <label htmlFor="packing-item" className="label">
            Item
          </label>
          <input
            id="packing-item"
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        <button className="btn-primary" type="submit">
          Add item
        </button>
      </form>
      <p className="mt-4 text-sm" role="status" data-testid="packing-count">
        {items.length} {items.length === 1 ? "item" : "items"} packed
      </p>
      <ul className="mt-2 list-disc pl-6 text-sm" aria-label="Packed items">
        {items.map((name, i) => (
          <li key={`${i}-${name}`}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
