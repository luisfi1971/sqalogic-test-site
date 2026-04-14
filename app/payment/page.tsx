"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useBooking, useRelease } from "../providers";
import ConfirmModal from "../components/ConfirmModal";
import ShadowInput from "../components/ShadowInput";

export default function PaymentPage() {
  const { user } = useAuth();
  const { pending, addBooking, setPending } = useBooking();
  const { dynId, release, randomDelay } = useRelease();
  const router = useRouter();
  const [card, setCard] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!pending?.flightId) {
    return (
      <div className="card max-w-xl mx-auto">
        <p>
          No pending booking.{" "}
          <a className="text-[color:var(--brand-accent)] underline" href="/search">
            Start over
          </a>
          .
        </p>
      </div>
    );
  }

  const digits = card.replace(/\s/g, "");
  const cardValid = digits.length >= 13 && digits.length <= 19 && /^\d+$/.test(digits);
  const expValid = /^\d{2}\/\d{2}$/.test(exp);
  const cvvValid = /^\d{3,4}$/.test(cvv);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!cardValid) {
      setError("Invalid card number");
      return;
    }
    if (!expValid) {
      setError("Expiry must be MM/YY");
      return;
    }
    if (!cvvValid) {
      setError("Invalid CVV");
      return;
    }
    setShowConfirm(true);
  };

  const finalize = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    await randomDelay();
    await new Promise((r) => setTimeout(r, 900));
    const id = `BK-${Date.now().toString(36).toUpperCase()}`;
    addBooking({
      id,
      flightId: pending.flightId!,
      from: pending.from || "",
      to: pending.to || "",
      date: pending.date || "",
      passenger: pending.passenger || name,
      price: pending.price || 0,
      createdAt: new Date().toISOString(),
    });
    setPending(null);
    router.push(`/confirmation?id=${id}`);
  };

  // release >= 2: Shadow DOM CVV
  // release >= 3: extra nested wrap
  const useShadowCvv = release >= 2;
  const deepNest = release >= 3;

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold">Payment</h1>
        <div className="mt-2 text-sm text-slate-600">
          Total: <strong>${pending.price}</strong>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <div className="label">Card number</div>
            <input
              id={dynId("pay_card")}
              className="input"
              placeholder="4242 4242 4242 4242"
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Name on card</div>
            <input
              id={dynId("pay_name")}
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">Expiry (MM/YY)</div>
              <input
                id={dynId("pay_exp")}
                className="input"
                placeholder="12/28"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
              />
            </div>
            <div>
              <div className="label">CVV</div>
              {useShadowCvv ? (
                deepNest ? (
                  <div className="container-l1">
                    <div className="container-l2">
                      <ShadowInput
                        label="CVV"
                        value={cvv}
                        onChange={setCvv}
                        placeholder="123"
                      />
                    </div>
                  </div>
                ) : (
                  <ShadowInput label="CVV" value={cvv} onChange={setCvv} placeholder="123" />
                )
              ) : (
                <input
                  id={dynId("pay_cvv")}
                  className="input"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              )}
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
            data-testid="pay-submit"
          >
            {submitting ? "Processing…" : "Pay now"}
          </button>
        </form>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm payment"
        confirmLabel={`Pay $${pending.price}`}
        cancelLabel="Cancel"
        onConfirm={finalize}
        onCancel={() => setShowConfirm(false)}
        delayMs={release >= 2 ? 600 : 0}
      >
        <div className="space-y-1">
          <div>
            Route: <strong>{pending.from} → {pending.to}</strong>
          </div>
          <div>
            Date: <strong>{pending.date}</strong>
          </div>
          <div>
            Passenger: <strong>{pending.passenger || name}</strong>
          </div>
          <div>
            Total: <strong>${pending.price}</strong>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Your card ending in <code>{digits.slice(-4)}</code> will be charged.
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
}
