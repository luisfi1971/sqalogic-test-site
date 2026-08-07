"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  delayMs = 0,
  testId = "confirm-modal",
  hideConfirm = false,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  delayMs?: number;
  testId?: string;
  hideConfirm?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [showBody, setShowBody] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) {
      setShowBody(false);
      return;
    }
    if (delayMs <= 0) {
      setShowBody(true);
      return;
    }
    const t = setTimeout(() => setShowBody(true), delayMs);
    return () => clearTimeout(t);
  }, [open, delayMs]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testId}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        data-modal-backdrop
      />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        {!showBody ? (
          <div className="mt-4 text-sm text-slate-500">Loading details…</div>
        ) : (
          <>
            <div className="mt-3 text-sm text-slate-600">{children}</div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onCancel}>
                {cancelLabel}
              </button>
              {!hideConfirm && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onConfirm}
                  data-testid={`${testId}-ok`}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
