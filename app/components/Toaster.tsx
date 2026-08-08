"use client";

import { useToast } from "../providers";

const TONE: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

/**
 * Toasts are the target for the canon's `toast.expect`. They auto-dismiss on a
 * timer, so a suite that asserts one has a real window to hit — and in latency
 * mode they arrive late, which is what makes waiting for the text mandatory
 * instead of optional.
 */
export default function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
      data-testid="toast-region"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          data-testid="toast"
          data-toast-kind={t.kind}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            TONE[t.kind] ?? TONE.info
          }`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
