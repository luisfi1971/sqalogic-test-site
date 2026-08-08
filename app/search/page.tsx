"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRelease } from "../providers";
import Calendar from "../components/Calendar";
import Dropdown from "../components/Dropdown";
import Tooltip from "../components/Tooltip";
import FavouriteAirports from "../components/FavouriteAirports";

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

export default function SearchPage() {
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

  const ctaLabel = release % 2 === 0 ? "Find Flights" : "Search flights";

  // On release >= 3, render the submit "button" as div role=button instead of a real <button>
  const fakeButton = release >= 3;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="card">
        <h1 className="text-2xl font-semibold">Search flights</h1>
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <div className="label">From</div>
            <Dropdown value={from} options={AIRPORTS} onChange={setFrom} label="from" />
          </div>
          <div>
            <div className="label">To</div>
            <Dropdown value={to} options={AIRPORTS} onChange={setTo} label="to" />
          </div>
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
                id={dynId("search_passengers")}
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
            {fakeButton ? (
              <div
                role="button"
                tabIndex={0}
                data-action="submit-search"
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
              <button type="submit" className="btn-primary w-full md:w-auto" disabled={loading}>
                {loading ? "Searching…" : ctaLabel}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-6">
      <FavouriteAirports />

      <div className="card">
        <h2 className="text-sm font-semibold">Subscribe for deals</h2>
        <p className="mt-1 text-xs text-slate-500">
          This newsletter form lives inside an iframe — classic automation challenge.
        </p>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <iframe
            src="/embed/newsletter"
            title="Newsletter signup"
            name="sqa-newsletter"
            id="newsletter-frame"
            className="w-full"
            style={{ height: 380, border: 0 }}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
