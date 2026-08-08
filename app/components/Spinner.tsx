"use client";

/**
 * The target for the canon's `spinnerGone` condition. It carries a stable hook
 * (`data-testid="spinner"`) plus `role="status"`, so both an attribute-based
 * and a role-based locator can wait for it to disappear.
 */
export default function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      data-testid="spinner"
      className="flex items-center justify-center gap-3 py-16 text-sm text-slate-600"
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[color:var(--brand-accent)]" />
      {label}…
    </div>
  );
}
