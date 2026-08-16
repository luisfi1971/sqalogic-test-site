"use client";

/**
 * Progress rail shared by the long booking wizard pages
 * (/booking/passenger → seats → extras → review → /payment).
 *
 * Presentational only. The active page passes its (1-based) step and the
 * variant-aware `tid` so `id-rotation` rotates the rail's testid exactly like
 * every other hook on the page.
 */
export const WIZARD_STEPS = ["Passenger", "Seats", "Extras", "Review", "Payment"] as const;

export default function StepsNav({
  current,
  tid,
}: {
  current: number;
  tid: (base: string) => string;
}) {
  return (
    <ol className="mt-4 flex flex-wrap gap-2 text-sm" data-testid={tid("booking-steps")}>
      {WIZARD_STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <li
            key={label}
            data-step={n}
            aria-current={n === current ? "step" : undefined}
            className={`rounded-md border px-3 py-1 ${
              n === current
                ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)] text-white"
                : n < current
                  ? "border-slate-300 bg-white text-slate-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {n}. {label}
          </li>
        );
      })}
    </ol>
  );
}

/** Shown by every wizard page when there is no draft (deep link, reload). */
export function NoDraft() {
  return (
    <div className="card max-w-xl mx-auto">
      <p>
        No flight selected for this booking.{" "}
        <a className="text-[color:var(--brand-accent)] underline" href="/search">
          Search flights
        </a>{" "}
        and choose <strong>Full booking</strong> on a result.
      </p>
    </div>
  );
}
