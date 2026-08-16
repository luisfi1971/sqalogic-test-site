"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "../../providers";
import StepsNav, { NoDraft } from "../StepsNav";
import { variantIds, type Variant } from "../../lib/testControls";

const COLS = ["A", "B", "C", "D", "E", "F"];
const ROWS = [1, 2, 3, 4, 5, 6];
const LEGROOM_ROWS = 2; // rows 1-2 carry a +$40 extra-legroom fee
const LEGROOM_FEE = 40;

type Seat = { id: string; row: number; col: string; taken: boolean; legroom: boolean };

/** Deterministic occupancy from the flight id — identical on every render/run. */
function buildSeats(flightId: string): Seat[] {
  let h = 0;
  for (let i = 0; i < flightId.length; i++) h = (h * 31 + flightId.charCodeAt(i)) >>> 0;
  const out: Seat[] = [];
  for (const r of ROWS) {
    for (const c of COLS) {
      out.push({
        id: `${r}${c}`,
        row: r,
        col: c,
        taken: (h + r * 7 + c.charCodeAt(0)) % 4 === 0,
        legroom: r <= LEGROOM_ROWS,
      });
    }
  }
  return out;
}

export default function SeatsClient({ variant = "none" }: { variant?: Variant }) {
  const { wizard, setWizard } = useWizard();
  const router = useRouter();
  const [seat, setSeat] = useState<string | null>(wizard?.seat ?? null);
  const [error, setError] = useState<string | null>(null);

  const seats = useMemo(() => buildSeats(wizard?.flightId || "default"), [wizard?.flightId]);

  // --- per-request variant application (same pattern as SearchForm) ---------
  const { tid } = variantIds(variant);
  const heading = variant === "text-change" ? "Seat selection" : "Choose your seat";
  const ctaLabel = variant === "text-change" ? "Next: extras" : "Continue to extras";
  const fakeButton = variant === "type-change";

  if (!wizard?.flightId) return <NoDraft />;

  const selected = seats.find((s) => s.id === seat) || null;
  const seatFee = selected?.legroom ? LEGROOM_FEE : 0;
  const remaining = seats.filter((s) => !s.taken).length;
  const runningTotal = (wizard.basePrice || 0) + seatFee;

  const onContinue = () => {
    if (!seat) {
      setError("Please select a seat");
      return;
    }
    setWizard({ ...wizard, seat, seatFee });
    router.push("/booking/extras");
  };

  const selectedTile = (
    <div className="card" data-testid={tid("seats-selected")}>
      <div className="text-xs text-slate-500">Selected seat</div>
      <div className="text-lg font-semibold" data-seat={seat || ""}>
        {selected ? `${selected.id}${selected.legroom ? ` (+$${LEGROOM_FEE})` : ""}` : "None"}
      </div>
    </div>
  );

  const remainingTile = (
    <div className="card" data-testid={tid("seats-remaining")}>
      <div className="text-xs text-slate-500">Seats available</div>
      <div className="text-lg font-semibold" data-remaining={remaining}>
        {remaining}
      </div>
    </div>
  );

  // `sibling-reorder` swaps the two summary tiles in DOM order (and on screen).
  const tiles =
    variant === "sibling-reorder" ? (
      <>
        {remainingTile}
        {selectedTile}
      </>
    ) : (
      <>
        {selectedTile}
        {remainingTile}
      </>
    );

  const gridInner = (
    <div
      className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4"
      data-testid={tid("seats-grid")}
    >
      <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
        {seats.map((s) => {
          const isSelected = seat === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={s.taken}
              aria-pressed={isSelected}
              data-testid={tid(`seat-${s.id}`)}
              data-seat-status={s.taken ? "taken" : isSelected ? "selected" : "free"}
              onClick={() => {
                setError(null);
                setSeat(isSelected ? null : s.id);
              }}
              className={`h-9 rounded-md border text-xs font-medium ${
                s.taken
                  ? "cursor-not-allowed border-slate-300 bg-slate-300 text-slate-500"
                  : isSelected
                    ? "border-blue-800 bg-[color:var(--brand-accent)] text-white"
                    : s.legroom
                      ? "border-amber-400 bg-amber-100 hover:bg-amber-200"
                      : "border-slate-300 bg-white hover:bg-slate-100"
              }`}
            >
              {s.id}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-white border border-slate-400" />
          Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-400" />
          Extra legroom (+${LEGROOM_FEE})
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-300" />
          Taken
        </span>
      </div>
    </div>
  );

  // `moved-container` keeps the grid identical but buries it under two extra
  // ancestors.
  const grid =
    variant === "moved-container" ? (
      <section data-section="cabin">
        <div className="contents">{gridInner}</div>
      </section>
    ) : (
      gridInner
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <StepsNav current={2} tid={tid} />

      <div className="card mt-4">
        <div className="text-sm text-slate-600">
          {wizard.airline} {wizard.flightId} &middot; {wizard.firstName} {wizard.lastName}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* `element-removed` deletes the selected-seat indicator — the
              designated removed element on this page. */}
          {variant === "element-removed" ? remainingTile : tiles}
          <div className="card" data-testid={tid("seats-total")}>
            <div className="text-xs text-slate-500">Running total</div>
            <div className="text-lg font-semibold">${runningTotal}</div>
          </div>
        </div>

        {grid}

        {error && (
          <div className="mt-3 text-sm text-red-600" role="alert" data-testid={tid("seats-error")}>
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn-ghost"
            data-testid={tid("seats-back")}
            onClick={() => router.push("/booking/passenger")}
          >
            Back
          </button>
          {fakeButton ? (
            <div
              role="button"
              tabIndex={0}
              data-testid={tid("seats-continue")}
              className="btn-primary cursor-pointer"
              onClick={onContinue}
              onKeyDown={(e) => {
                if (e.key === "Enter") onContinue();
              }}
            >
              {ctaLabel}
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary"
              data-testid={tid("seats-continue")}
              onClick={onContinue}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
