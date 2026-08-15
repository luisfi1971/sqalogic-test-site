"use client";

import { useRouter } from "next/navigation";
import { useBooking, useWizard } from "../../providers";
import StepsNav, { NoDraft } from "../StepsNav";
import { extrasTotal } from "../extras/ExtrasClient";
import { variantIds, type Variant } from "../../lib/testControls";

export default function ReviewClient({ variant = "none" }: { variant?: Variant }) {
  const { wizard } = useWizard();
  const { setPending } = useBooking();
  const router = useRouter();

  // --- per-request variant application (same pattern as SearchForm) ---------
  const { tid } = variantIds(variant);
  const heading = variant === "text-change" ? "Booking summary" : "Review your booking";
  const ctaLabel = variant === "text-change" ? "Confirm and pay" : "Proceed to payment";
  const fakeButton = variant === "type-change";

  if (!wizard?.flightId) return <NoDraft />;

  const addons = extrasTotal(wizard);
  const total = (wizard.basePrice || 0) + (wizard.seatFee || 0) + addons;
  const passengerName = `${wizard.title || ""} ${wizard.firstName || ""} ${
    wizard.lastName || ""
  }`.trim();
  const addonList =
    [
      wizard.priorityBoarding ? "Priority boarding" : null,
      wizard.wifi ? "Onboard Wi-Fi" : null,
    ]
      .filter(Boolean)
      .join(", ") || "None";

  const onProceed = () => {
    // Fold the wizard draft into the classic `pending` booking that /payment
    // and /confirmation already consume — same state mechanism the short flow
    // has always used.
    setPending({
      flightId: wizard.flightId,
      from: wizard.from,
      to: wizard.to,
      date: wizard.date,
      passenger: `${wizard.firstName} ${wizard.lastName}`.trim(),
      price: total,
      seat: wizard.seat ?? null,
      baggage: (wizard.baggage || "none") !== "none",
    });
    router.push("/payment");
  };

  const flightBlock = (
    <div data-testid={tid("review-flight-block")}>
      <h2 className="text-sm font-semibold text-slate-500">Flight</h2>
      <dl className="mt-2 space-y-1 text-sm">
        <Row label="Flight" testid={tid("review-flight")} value={`${wizard.airline} ${wizard.flightId}`} />
        <Row label="Route" testid={tid("review-route")} value={`${wizard.from} → ${wizard.to}`} />
        <Row label="Date" testid={tid("review-date")} value={wizard.date || ""} />
      </dl>
    </div>
  );

  const passengerBlock = (
    <div data-testid={tid("review-passenger-block")}>
      <h2 className="text-sm font-semibold text-slate-500">Passenger</h2>
      <dl className="mt-2 space-y-1 text-sm">
        <Row label="Name" testid={tid("review-passenger")} value={passengerName} />
        <Row label="Passport" testid={tid("review-passport")} value={wizard.passport || ""} />
        <Row label="Nationality" testid={tid("review-nationality")} value={wizard.nationality || ""} />
        <Row label="Email" testid={tid("review-email")} value={wizard.email || ""} />
      </dl>
    </div>
  );

  // `sibling-reorder` swaps the Flight and Passenger blocks in DOM order.
  const blocks =
    variant === "sibling-reorder" ? (
      <>
        {passengerBlock}
        {flightBlock}
      </>
    ) : (
      <>
        {flightBlock}
        {passengerBlock}
      </>
    );

  const totalRowInner = (
    <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium">Total to pay</span>
      <strong className="text-xl" data-testid={tid("review-total")}>
        ${total}
      </strong>
    </div>
  );

  // `moved-container` buries the total row under two extra ancestors.
  const totalRow =
    variant === "moved-container" ? (
      <section data-section="pricing">
        <div>{totalRowInner}</div>
      </section>
    ) : (
      totalRowInner
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <StepsNav current={4} tid={tid} />

      <div className="card mt-4">
        <div className="grid gap-6 sm:grid-cols-2">{blocks}</div>

        <div className="mt-6" data-testid={tid("review-trip-block")}>
          <h2 className="text-sm font-semibold text-slate-500">Trip options</h2>
          <dl className="mt-2 space-y-1 text-sm">
            {/* `element-removed` deletes the seat row outright — the designated
                removed element on this page. */}
            {variant === "element-removed" ? null : (
              <Row
                label="Seat"
                testid={tid("review-seat")}
                value={`${wizard.seat || "—"}${wizard.seatFee ? ` (+$${wizard.seatFee})` : ""}`}
              />
            )}
            <Row
              label="Baggage"
              testid={tid("review-baggage")}
              value={
                wizard.baggage === "two"
                  ? "2 checked bags"
                  : wizard.baggage === "one"
                    ? "1 checked bag"
                    : "No checked bag"
              }
            />
            <Row label="Meal" testid={tid("review-meal")} value={wizard.meal || "Standard"} />
            <Row
              label="Insurance"
              testid={tid("review-insurance")}
              value={wizard.insurance === "yes" ? "Yes" : "No"}
            />
            <Row label="Add-ons" testid={tid("review-addons")} value={addonList} />
          </dl>
        </div>

        {totalRow}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn-ghost"
            data-testid={tid("review-back")}
            onClick={() => router.push("/booking/extras")}
          >
            Back
          </button>
          {fakeButton ? (
            <div
              role="button"
              tabIndex={0}
              data-testid={tid("review-continue")}
              className="btn-primary cursor-pointer"
              onClick={onProceed}
              onKeyDown={(e) => {
                if (e.key === "Enter") onProceed();
              }}
            >
              {ctaLabel}
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary"
              data-testid={tid("review-continue")}
              onClick={onProceed}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium" data-testid={testid}>
        {value}
      </dd>
    </div>
  );
}
