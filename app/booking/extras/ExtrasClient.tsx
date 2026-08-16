"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRelease, useWizard } from "../../providers";
import StepsNav, { NoDraft } from "../StepsNav";
import { variantIds, type Variant } from "../../lib/testControls";

export const BAGGAGE_PRICES = { none: 0, one: 35, two: 60 } as const;
export const MEAL_PRICES: Record<string, number> = {
  Standard: 0,
  Vegetarian: 12,
  Vegan: 12,
  "Gluten free": 12,
};
export const INSURANCE_PRICE = 24;
export const PRIORITY_PRICE = 15;
export const WIFI_PRICE = 10;

export function extrasTotal(w: {
  baggage?: "none" | "one" | "two";
  meal?: string;
  insurance?: "yes" | "no";
  priorityBoarding?: boolean;
  wifi?: boolean;
}): number {
  return (
    BAGGAGE_PRICES[w.baggage || "none"] +
    (MEAL_PRICES[w.meal || "Standard"] ?? 0) +
    (w.insurance === "yes" ? INSURANCE_PRICE : 0) +
    (w.priorityBoarding ? PRIORITY_PRICE : 0) +
    (w.wifi ? WIFI_PRICE : 0)
  );
}

export default function ExtrasClient({ variant = "none" }: { variant?: Variant }) {
  const { wizard, setWizard } = useWizard();
  const { dynId } = useRelease();
  const router = useRouter();

  const [baggage, setBaggage] = useState<"none" | "one" | "two">(wizard?.baggage || "none");
  const [meal, setMeal] = useState(wizard?.meal || "Standard");
  const [insurance, setInsurance] = useState<"yes" | "no">(wizard?.insurance || "no");
  const [priorityBoarding, setPriorityBoarding] = useState(!!wizard?.priorityBoarding);
  const [wifi, setWifi] = useState(!!wizard?.wifi);

  // --- per-request variant application (same pattern as SearchForm) ---------
  const { tid, rid } = variantIds(variant);
  const heading = variant === "text-change" ? "Optional extras" : "Trip extras";
  const ctaLabel = variant === "text-change" ? "Next: review" : "Continue to review";
  const fakeButton = variant === "type-change";

  if (!wizard?.flightId) return <NoDraft />;

  const addons = extrasTotal({ baggage, meal, insurance, priorityBoarding, wifi });
  const runningTotal = (wizard.basePrice || 0) + (wizard.seatFee || 0) + addons;

  const onContinue = () => {
    setWizard({ ...wizard, baggage, meal, insurance, priorityBoarding, wifi });
    router.push("/booking/review");
  };

  const idMeal = rid(dynId("extras_meal"));

  const baggageGroup = (
    <div data-testid={tid("extras-baggage-group")}>
      <div className="label">Checked baggage</div>
      <div className="mt-1 space-y-2 text-sm">
        {(
          [
            ["none", "No checked bag", BAGGAGE_PRICES.none],
            ["one", "1 checked bag (23kg)", BAGGAGE_PRICES.one],
            ["two", "2 checked bags (23kg each)", BAGGAGE_PRICES.two],
          ] as const
        ).map(([value, label, price]) => (
          <label key={value} className="flex items-center gap-2">
            <input
              type="radio"
              name="baggage"
              checked={baggage === value}
              data-testid={tid(`extras-baggage-${value}`)}
              onChange={() => setBaggage(value)}
            />
            <span>
              {label}
              {price > 0 ? ` (+$${price})` : ""}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  // `element-removed` deletes the meal select outright — the designated removed
  // element on this page. The meal defaults to Standard, so the flow can still
  // complete; the fill step and its assertion cannot.
  const mealGroup =
    variant === "element-removed" ? null : (
      <div>
        <label htmlFor={idMeal} className="label">
          Meal preference
        </label>
        <select
          id={idMeal}
          className="input"
          data-testid={tid("extras-meal")}
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
        >
          {Object.entries(MEAL_PRICES).map(([name, price]) => (
            <option key={name} value={name}>
              {name}
              {price > 0 ? ` (+$${price})` : ""}
            </option>
          ))}
        </select>
      </div>
    );

  // `sibling-reorder` swaps the baggage and meal groups in DOM order.
  const baggageAndMeal =
    variant === "sibling-reorder" ? (
      <>
        {mealGroup}
        {baggageGroup}
      </>
    ) : (
      <>
        {baggageGroup}
        {mealGroup}
      </>
    );

  const insuranceGroupInner = (
    <div data-testid={tid("extras-insurance-group")}>
      <div className="label">Travel insurance (+${INSURANCE_PRICE})</div>
      <div className="mt-1 flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="insurance"
            checked={insurance === "yes"}
            data-testid={tid("extras-insurance-yes")}
            onChange={() => setInsurance("yes")}
          />
          Yes, cover my trip
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="insurance"
            checked={insurance === "no"}
            data-testid={tid("extras-insurance-no")}
            onChange={() => setInsurance("no")}
          />
          No insurance
        </label>
      </div>
    </div>
  );

  // `moved-container` buries the insurance group under two extra ancestors.
  const insuranceGroup =
    variant === "moved-container" ? (
      <section data-section="coverage">
        <fieldset className="m-0 border-0 p-0">{insuranceGroupInner}</fieldset>
      </section>
    ) : (
      insuranceGroupInner
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <StepsNav current={3} tid={tid} />

      <div className="card mt-4">
        <div className="text-sm text-slate-600">
          {wizard.airline} {wizard.flightId} &middot; seat{" "}
          <strong>{wizard.seat || "—"}</strong>
        </div>

        <div className="mt-6 space-y-5">
          {baggageAndMeal}
          {insuranceGroup}

          <div>
            <div className="label">Add-ons</div>
            <div className="mt-1 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={priorityBoarding}
                  data-testid={tid("extras-priority")}
                  onChange={(e) => setPriorityBoarding(e.target.checked)}
                />
                Priority boarding (+${PRIORITY_PRICE})
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wifi}
                  data-testid={tid("extras-wifi")}
                  onChange={(e) => setWifi(e.target.checked)}
                />
                Onboard Wi-Fi (+${WIFI_PRICE})
              </label>
            </div>
          </div>
        </div>

        <div
          className="mt-6 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
          data-testid={tid("extras-summary")}
        >
          <div className="text-sm text-slate-600">
            Extras: <strong data-testid={tid("extras-addons-total")}>${addons}</strong>
          </div>
          <div className="text-sm">
            Running total:{" "}
            <strong className="text-lg" data-testid={tid("extras-total")}>
              ${runningTotal}
            </strong>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn-ghost"
            data-testid={tid("extras-back")}
            onClick={() => router.push("/booking/seats")}
          >
            Back
          </button>
          {fakeButton ? (
            <div
              role="button"
              tabIndex={0}
              data-testid={tid("extras-continue")}
              className="btn-primary cursor-pointer"
              onClick={onContinue}
              onKeyDown={(e) => {
                if (e.key === "Enter") onContinue();
              }}
            >
              {ctaLabel}
            </div>
          ) : (
            <button
              type="button"
              className="btn-primary"
              data-testid={tid("extras-continue")}
              onClick={onContinue}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
