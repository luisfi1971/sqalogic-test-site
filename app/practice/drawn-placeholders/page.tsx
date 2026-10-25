"use client";

import { useState } from "react";

/**
 * DRAWN PLACEHOLDERS — a stable test-bed page for a pick widget that has no
 * placeholder ATTRIBUTE (SQALOGIC TestHub, 2026-10-25).
 *
 * Every pick below is built the way custom select widgets are built: an
 * <input role="combobox"> with an id numbered by the order the widgets render
 * (pick-2-input, pick-3-input), no label of its own, no placeholder attribute,
 * and the words "Choose a region" / "Choose a depot" painted by a SIBLING drawn
 * inside the field's own box, which the input points at with
 * aria-describedby. One caption ("Region and depot") sits over BOTH fields, so
 * it names neither. Once a value is chosen, the drawn words disappear.
 *
 * A tool must never record the drawn words as the input's placeholder
 * attribute (an address spelling [placeholder="Choose a region"] matches
 * nothing), and must still tell the two picks apart by what each shows.
 */
const PICKS = [
  {
    key: "region",
    drawn: "Choose a region",
    options: ["North", "South", "East", "West"],
  },
  {
    key: "depot",
    drawn: "Choose a depot",
    options: ["Harbour", "Airport", "Rail yard"],
  },
] as const;

function Pick(props: {
  n: number;
  drawn: string;
  options: readonly string[];
  disabled: boolean;
  value: string;
  onChoose: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputId = `pick-${props.n}-input`;
  const drawnId = `pick-${props.n}-placeholder`;
  const listId = `pick-${props.n}-listbox`;
  return (
    <div className="relative w-56">
      <div className="relative rounded border border-gray-400 bg-white px-2 py-1">
        {props.value === "" ? (
          <div id={drawnId} className="pointer-events-none absolute left-2 top-1 text-gray-500">
            {props.drawn}
          </div>
        ) : (
          <div className="pointer-events-none absolute left-2 top-1">{props.value}</div>
        )}
        <div>
          <input
            id={inputId}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-describedby={props.value === "" ? drawnId : undefined}
            autoComplete="off"
            disabled={props.disabled}
            className="w-full bg-transparent outline-none"
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            readOnly
            value=""
          />
        </div>
      </div>
      {open && !props.disabled ? (
        <div id={listId} role="listbox" className="absolute z-10 mt-1 w-full rounded border bg-white">
          {props.options.map((o) => (
            <div
              key={o}
              role="option"
              aria-selected={props.value === o}
              tabIndex={-1}
              className="cursor-pointer px-2 py-1 hover:bg-gray-100"
              onMouseDown={(e) => {
                e.preventDefault();
                props.onChoose(o);
                setOpen(false);
              }}
            >
              {o}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function DrawnPlaceholdersPage() {
  const [region, setRegion] = useState("");
  const [depot, setDepot] = useState("");
  const [sent, setSent] = useState("");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dispatch a parcel</h1>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(region && depot ? `Dispatched to ${depot}, ${region}` : "Choose both first");
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-40 pt-1">
            <span>Region and depot</span>
          </div>
          {/* Render order numbers the ids: the first pick is pick-2, the second pick-3. */}
          <div>
            <Pick
              n={2}
              drawn={PICKS[0].drawn}
              options={PICKS[0].options}
              disabled={false}
              value={region}
              onChoose={(v) => {
                setRegion(v);
                setDepot("");
              }}
            />
          </div>
          <div>
            <Pick
              n={3}
              drawn={PICKS[1].drawn}
              options={PICKS[1].options}
              disabled={region === ""}
              value={depot}
              onChoose={setDepot}
            />
          </div>
        </div>
        <button type="submit" className="btn">
          Dispatch
        </button>
        <p role="status" data-testid="dispatch-result">
          {sent}
        </p>
      </form>
    </div>
  );
}
