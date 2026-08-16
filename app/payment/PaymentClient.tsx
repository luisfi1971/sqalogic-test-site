"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useBooking, useRelease } from "../providers";
import ConfirmModal from "../components/ConfirmModal";
import ShadowInput from "../components/ShadowInput";
import { variantIds, type Variant } from "../lib/testControls";

/** Groups of four: "4242424242424242" → "4242 4242 4242 4242". */
export function maskCard(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Auto-slash: "1228" → "12/28". Typing "12/28" normalises to the same thing. */
export function maskExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Digits only, max 4. */
export function maskCvv(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export default function PaymentClient({ variant = "none" }: { variant?: Variant }) {
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

  // --- per-request variant application (same pattern as SearchForm) ---------
  const { tid, rid } = variantIds(variant);
  const heading = variant === "text-change" ? "Secure payment" : "Payment";
  const ctaLabel = variant === "text-change" ? "Complete purchase" : "Pay now";
  const fakeButton = variant === "type-change";

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

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
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
    await addBooking({
      id,
      flightId: pending.flightId!,
      from: pending.from || "",
      to: pending.to || "",
      date: pending.date || "",
      passenger: pending.passenger || name,
      price: pending.price || 0,
      createdAt: new Date().toISOString(),
      seat: pending.seat ?? null,
      baggage: !!pending.baggage,
    });
    setPending(null);
    router.push(`/confirmation?id=${id}`);
  };

  // release >= 2: Shadow DOM CVV
  // release >= 3: extra nested wrap
  const useShadowCvv = release >= 2;
  const deepNest = release >= 3;

  const cardFieldInner = (
    <div>
      <div className="label">Card number</div>
      <input
        id={rid(dynId("pay_card"))}
        className="input"
        placeholder="4242 4242 4242 4242"
        data-testid={tid("payment-card")}
        value={card}
        onChange={(e) => setCard(maskCard(e.target.value))}
      />
    </div>
  );

  // `moved-container` buries the card number field under two extra ancestors.
  const cardField =
    variant === "moved-container" ? (
      <section data-section="card-details">
        <fieldset className="m-0 border-0 p-0">{cardFieldInner}</fieldset>
      </section>
    ) : (
      cardFieldInner
    );

  const expField = (
    <div>
      <div className="label">Expiry (MM/YY)</div>
      <input
        id={rid(dynId("pay_exp"))}
        className="input"
        placeholder="12/28"
        data-testid={tid("payment-expiry")}
        value={exp}
        onChange={(e) => setExp(maskExpiry(e.target.value))}
      />
    </div>
  );

  const cvvField = (
    <div>
      <div className="label">CVV</div>
      {useShadowCvv ? (
        deepNest ? (
          <div className="container-l1">
            <div className="container-l2">
              <ShadowInput
                label="CVV"
                value={cvv}
                onChange={(v) => setCvv(maskCvv(v))}
                placeholder="123"
              />
            </div>
          </div>
        ) : (
          <ShadowInput label="CVV" value={cvv} onChange={(v) => setCvv(maskCvv(v))} placeholder="123" />
        )
      ) : (
        <input
          id={rid(dynId("pay_cvv"))}
          className="input"
          placeholder="123"
          data-testid={tid("payment-cvv")}
          value={cvv}
          onChange={(e) => setCvv(maskCvv(e.target.value))}
        />
      )}
    </div>
  );

  // `sibling-reorder` swaps Expiry and CVV in DOM order (and on screen).
  const expiryAndCvv =
    variant === "sibling-reorder" ? (
      <>
        {cvvField}
        {expField}
      </>
    ) : (
      <>
        {expField}
        {cvvField}
      </>
    );

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <div className="mt-2 text-sm text-slate-600">
          Total: <strong data-testid={tid("payment-total")}>${pending.price}</strong>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {cardField}
          <div>
            <div className="label">Name on card</div>
            <input
              id={rid(dynId("pay_name"))}
              className="input"
              data-testid={tid("payment-name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">{expiryAndCvv}</div>
          {error && (
            <div className="text-sm text-red-600" role="alert" data-testid={tid("payment-error")}>
              {error}
            </div>
          )}
          {/* `element-removed` deletes the pay control outright. */}
          {variant === "element-removed" ? null : fakeButton ? (
            <div
              role="button"
              tabIndex={0}
              data-testid={tid("pay-submit")}
              className="btn-primary w-full cursor-pointer text-center"
              onClick={() => onSubmit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            >
              {submitting ? "Processing…" : ctaLabel}
            </div>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
              data-testid={tid("pay-submit")}
            >
              {submitting ? "Processing…" : ctaLabel}
            </button>
          )}
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
