"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRelease } from "../providers";
import Calendar from "../components/Calendar";
import Dropdown from "../components/Dropdown";
import Tooltip from "../components/Tooltip";
import { ROTATED_SUFFIX, type Variant } from "../lib/testControls";

const AIRPORTS = [
  "YUL - Montreal",
  "YYZ - Toronto",
  "JFK - New York",
  "LAX - Los Angeles",
  "LHR - London",
  "CDG - Paris",
  "GRU - Sao Paulo",
  "GIG - Rio de Janeiro",
  "MAD - Madrid",
  "FRA - Frankfurt",
];

export default function SearchForm({ variant = "none" }: { variant?: Variant }) {
  const { dynId, release, randomDelay } = useRelease();
  const router = useRouter();
  const [from, setFrom] = useState(AIRPORTS[0]);
  const [to, setTo] = useState(AIRPORTS[2]);
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10)
  );
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await randomDelay();
    const q = new URLSearchParams({
      from,
      to,
      date,
      passengers: String(passengers),
      tripType,
    }).toString();
    router.push(`/results?${q}`);
  };

  // --- per-request variant application -------------------------------------
  // Every value below collapses to the historical behaviour when variant is
  // "none", which is what a request with no ?variant= resolves to.
  const rotated = variant === "id-rotation";
  const tid = (base: string) => (rotated ? `${base}-${ROTATED_SUFFIX}` : base);
  const rid = (base: string) => (rotated ? `${base}_${ROTATED_SUFFIX}` : base);

  const heading = variant === "text-change" ? "Flight search" : "Search flights";
  const releaseLabel = release % 2 === 0 ? "Find Flights" : "Search flights";
  const ctaLabel = variant === "text-change" ? "Find Flights" : releaseLabel;

  // On release >= 3 the submit is historically a div[role=button] rather than a
  // real <button>. `type-change` flips whichever one the current release
  // renders, so the tag always changes while role and accessible name do not.
  const baselineFakeButton = release >= 3;
  const fakeButton = variant === "type-change" ? !baselineFakeButton : baselineFakeButton;

  const fromField = (
    <div data-testid={tid("search-from")}>
      <div className="label">From</div>
      <Dropdown value={from} options={AIRPORTS} onChange={setFrom} label="from" />
    </div>
  );

  const toFieldInner = (
    <div data-testid={tid("search-to")}>
      <div className="label">To</div>
      <Dropdown value={to} options={AIRPORTS} onChange={setTo} label="to" />
    </div>
  );

  // `moved-container` keeps the field, its label and its accessible name
  // identical but buries it under two extra ancestors.
  const toField =
    variant === "moved-container" ? (
      <section data-section="route-details">
        <fieldset className="m-0 border-0 p-0">{toFieldInner}</fieldset>
      </section>
    ) : (
      toFieldInner
    );

  // `sibling-reorder` swaps From and To in DOM order (and on screen).
  const routeFields =
    variant === "sibling-reorder" ? (
      <>
        {toField}
        {fromField}
      </>
    ) : (
      <>
        {fromField}
        {toField}
      </>
    );

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <form
        onSubmit={onSubmit}
        data-testid={tid("search-form")}
        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2 flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="trip"
              checked={tripType === "oneway"}
              onChange={() => setTripType("oneway")}
            />
            One way
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="trip"
              checked={tripType === "roundtrip"}
              onChange={() => setTripType("roundtrip")}
            />
            Round trip
          </label>
        </div>
        {routeFields}
        <div>
          <div className="label">Departure date</div>
          <Calendar value={date} onChange={setDate} label="departure" />
        </div>
        <div>
          <div className="label">
            Passengers{" "}
            <Tooltip content="Up to 9 passengers per booking">
              <span className="ml-1 text-xs text-slate-400 cursor-help">ⓘ</span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost px-3"
              onClick={() => setPassengers((p) => Math.max(1, p - 1))}
              aria-label="Decrease passengers"
            >
              -
            </button>
            <div
              className="w-12 text-center font-semibold"
              id={rid(dynId("search_passengers"))}
              data-passengers={passengers}
            >
              {passengers}
            </div>
            <button
              type="button"
              className="btn-ghost px-3"
              onClick={() => setPassengers((p) => Math.min(9, p + 1))}
              aria-label="Increase passengers"
            >
              +
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          {/* `element-removed` deletes the submit control outright. */}
          {variant === "element-removed" ? null : fakeButton ? (
            <div
              role="button"
              tabIndex={0}
              data-action="submit-search"
              data-testid={tid("search-submit")}
              className="btn-primary w-full md:w-auto cursor-pointer"
              onClick={() => onSubmit(new Event("submit") as unknown as React.FormEvent)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSubmit(new Event("submit") as unknown as React.FormEvent);
                }
              }}
            >
              {loading ? "Searching…" : ctaLabel}
            </div>
          ) : (
            <button
              type="submit"
              data-testid={tid("search-submit")}
              className="btn-primary w-full md:w-auto"
              disabled={loading}
            >
              {loading ? "Searching…" : ctaLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
