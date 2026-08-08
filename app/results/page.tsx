"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking, useI18n, useLatency, useRelease } from "../providers";
import Spinner from "../components/Spinner";
import AirlineRating from "../components/AirlineRating";
import { SETTLE_SWINGS, settlePrice } from "../lib/latency";

type Flight = {
  id: string;
  airline: string;
  depart: string;
  arrive: string;
  duration: string;
  stops: number;
  price: number;
};

const AIRLINES = ["SQALOGIC Air", "TestJet", "AutomationWings", "RegressAir", "Continuous Airlines"];

function seedFlights(from: string, to: string, date: string): Flight[] {
  const base = hash(from + to + date);
  return Array.from({ length: 6 }, (_, i) => {
    const h = (base + i * 37) % 24;
    const depart = `${String(h).padStart(2, "0")}:${String(((base * (i + 1)) % 60)).padStart(2, "0")}`;
    const dur = 2 + ((base + i) % 10);
    const arriveH = (h + dur) % 24;
    return {
      id: `FL-${base}-${i}`,
      airline: AIRLINES[(base + i) % AIRLINES.length],
      depart,
      arrive: `${String(arriveH).padStart(2, "0")}:${String(((base * (i + 3)) % 60)).padStart(2, "0")}`,
      duration: `${dur}h ${((base * i) % 60)}m`,
      stops: i % 3 === 0 ? 0 : 1,
      price: 150 + ((base * (i + 1)) % 800),
    };
  });
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}


function ResultsInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { setPending } = useBooking();
  const { release, dynClass } = useRelease();
  const { latency } = useLatency();
  const { t } = useI18n();

  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const date = sp.get("date") || "";
  const flights = useMemo(() => seedFlights(from, to, date), [from, to, date]);

  // Latency mode: the results take a moment to come back, then the prices
  // wobble before they converge. Off, the page stays instantaneous.
  //
  // Both are derived from the current query rather than mirrored into state on
  // every change, so a new search resets them without an effect having to
  // write state synchronously.
  const query = `${latency}|${from}|${to}|${date}`;
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const [settled, setSettled] = useState<{ query: string; step: number }>({ query: "", step: 0 });

  const searching = latency && searchedQuery !== query;
  const settleStep = !latency
    ? SETTLE_SWINGS.length
    : settled.query === query
      ? settled.step
      : 0;

  useEffect(() => {
    if (!latency) return;
    const t = setTimeout(() => setSearchedQuery(query), 1400);
    return () => clearTimeout(t);
  }, [latency, query]);

  useEffect(() => {
    if (!latency || searching || settleStep >= SETTLE_SWINGS.length) return;
    const t = setTimeout(() => setSettled({ query, step: settleStep + 1 }), 450);
    return () => clearTimeout(t);
  }, [latency, searching, settleStep, query]);

  const select = (f: Flight) => {
    setPending({ flightId: f.id, from, to, date, price: f.price });
    router.push("/book");
  };

  // Intentionally put the Select button inside nested wrappers with no stable attrs on odd releases.
  const deepWrap = release % 2 === 1;

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Flights from <span className="text-[color:var(--brand-accent)]">{from}</span> to{" "}
        <span className="text-[color:var(--brand-accent)]">{to}</span>
      </h1>
      <p className="text-sm text-slate-600">{t("results.departing", { date })}</p>

      {searching && <Spinner label={t("results.searching")} />}

      <ul className={`mt-6 space-y-3 ${dynClass("results-list")}`} hidden={searching}>
        {flights.map((f, i) => (
          <li key={f.id} className="card flex flex-wrap items-center justify-between gap-4" data-flight-id={f.id}>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{f.airline}</span>
                <AirlineRating airline={f.airline} rating={2 + (i % 4)} />
              </div>
              <div className="text-sm text-slate-600">
                {f.depart} → {f.arrive} &middot; {f.duration} &middot;{" "}
                {f.stops === 0 ? t("results.nonstop") : `${f.stops} stop`}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold" data-price-for={f.id}>
                ${settlePrice(f.price, settleStep, i)}
              </div>
              {deepWrap ? (
                <div><div><div>
                  <button onClick={() => select(f)} className="btn-primary">{t("results.select")}</button>
                </div></div></div>
              ) : (
                <button
                  onClick={() => select(f)}
                  className="btn-primary"
                  data-testid={release < 3 ? `select-flight-${i}` : undefined}
                >
                  {t("results.select")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ResultsInner />
    </Suspense>
  );
}
