"use client";

import { useEffect, useState } from "react";

export default function IframePracticePage() {
  const [ticket, setTicket] = useState<string | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; ref?: string } | null;
      if (data?.type === "sqa:ticket" && typeof data.ref === "string") setTicket(data.ref);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Support ticket (in an iframe)</h1>
      <p className="mt-2 text-sm text-slate-600">
        The form below lives in a separate same-origin document at{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">/embed/support</code>. Your
        automation has to switch into the frame to fill it, then switch back out to read
        the ticket reference the parent page picks up.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <iframe
          src="/embed/support"
          title="Support ticket form"
          name="sqa-support"
          id="support-frame"
          className="w-full"
          style={{ height: 520, border: 0 }}
        />
      </div>

      <div className="card mt-4" data-testid="parent-ticket-panel">
        <h2 className="text-sm font-semibold">Parent page</h2>
        <p className="mt-1 text-sm" aria-live="polite">
          {ticket ? (
            <>
              Latest ticket:{" "}
              <span className="font-mono font-semibold" data-testid="parent-ticket-ref">
                {ticket}
              </span>
            </>
          ) : (
            <span data-testid="parent-ticket-empty">No ticket created yet.</span>
          )}
        </p>
      </div>
    </div>
  );
}
