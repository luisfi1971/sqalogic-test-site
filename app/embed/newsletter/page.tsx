"use client";

import { useState } from "react";

export default function NewsletterEmbed() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setError("Invalid email");
      return;
    }
    if (code.trim().toUpperCase() !== "SQA2025") {
      setError('Code must be "SQA2025"');
      return;
    }
    setError(null);
    setDone(true);
  };

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-4 max-w-md"
      data-testid="newsletter-embed"
    >
      <h2 className="text-base font-semibold">Subscribe to SQA deals</h2>
      {done ? (
        <p className="mt-2 text-sm font-medium text-green-700" data-testid="newsletter-ok">
          Subscribed! Welcome aboard.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          <div>
            <label htmlFor="nl_email" className="text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              id="nl_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="nl_code" className="text-xs font-medium text-slate-700">
              Promo code
            </label>
            <input
              id="nl_code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter SQA2025"
              className="input"
            />
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <button type="submit" id="nl_submit" className="btn-primary">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
