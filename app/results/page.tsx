"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking, useRelease } from "../providers";

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

  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const date = sp.get("date") || "";
  const flights = useMemo(() => seedFlights(from, to, date), [from, to, date]);

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
      <p className="text-sm text-slate-600">Departing {date}</p>

      <ul className={`mt-6 space-y-3 ${dynClass("results-list")}`}>
        {flights.map((f, i) => (
          <li key={f.id} className="card flex flex-wrap items-center justify-between gap-4" data-flight-id={f.id}>
            <div>
              <div className="font-semibold">{f.airline}</div>
              <div className="text-sm text-slate-600">
                {f.depart} → {f.arrive} &middot; {f.duration} &middot;{" "}
                {f.stops === 0 ? "Non-stop" : `${f.stops} stop`}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold">${f.price}</div>
              {deepWrap ? (
                <div><div><div>
                  <button onClick={() => select(f)} className="btn-primary">Select</button>
                </div></div></div>
              ) : (
                <button
                  onClick={() => select(f)}
                  className="btn-primary"
                  data-testid={release < 3 ? `select-flight-${i}` : undefined}
                >
                  Select
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
