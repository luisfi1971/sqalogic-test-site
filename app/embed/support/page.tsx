"use client";

import { useState } from "react";

const TOPICS = ["Baggage", "Refund", "Schedule change", "Special assistance"];

export default function SupportEmbed() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return setError("Enter a valid email address");
    if (message.trim().length < 10)
      return setError("Tell us a little more — at least 10 characters");

    setError(null);
    // Deterministic ticket reference derived from the submitted values.
    const basis = `${name}${email}${topic}`.toUpperCase();
    let h = 0;
    for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) >>> 0;
    const ref = `TCK-${(h % 900000) + 100000}`;
    setTicket(ref);
    // Tell the hosting page, same-origin only.
    try {
      window.parent?.postMessage({ type: "sqa:ticket", ref }, window.location.origin);
    } catch {}
  };

  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-4"
      data-testid="support-embed"
    >
      <h2 className="text-base font-semibold">Contact support</h2>

      {ticket ? (
        <p className="mt-3 text-sm font-medium text-emerald-700" data-testid="support-ok">
          Ticket <span className="font-mono">{ticket}</span> created. We reply within 24
          hours.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-3" data-testid="support-form">
          <div>
            <label htmlFor="sup_name" className="label">
              Your name
            </label>
            <input
              id="sup_name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sup_email" className="label">
              Email
            </label>
            <input
              id="sup_email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="sup_topic" className="label">
              Topic
            </label>
            <select
              id="sup_topic"
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sup_message" className="label">
              How can we help?
            </label>
            <textarea
              id="sup_message"
              className="input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-red-600" role="alert" data-testid="support-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary">
            Create ticket
          </button>
        </form>
      )}
    </div>
  );
}
