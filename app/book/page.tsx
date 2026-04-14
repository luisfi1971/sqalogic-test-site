"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useBooking, useRelease } from "../providers";
import SeatMap from "../components/SeatMap";
import Tooltip from "../components/Tooltip";

export default function BookPage() {
  const { user } = useAuth();
  const { pending, setPending } = useBooking();
  const { dynId } = useRelease();
  const router = useRouter();
  const [passenger, setPassenger] = useState(user?.name || "");
  const [passport, setPassport] = useState("");
  const [seatClass, setSeatClass] = useState("economy");
  const [seat, setSeat] = useState<string | null>(null);
  const [baggage, setBaggage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pending?.flightId) {
    return (
      <div className="card max-w-xl mx-auto">
        <p>
          No flight selected.{" "}
          <a className="text-[color:var(--brand-accent)] underline" href="/search">
            Search flights
          </a>
          .
        </p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!passenger.trim()) {
      setError("Passenger name is required");
      return;
    }
    if (passport.length < 5) {
      setError("Passport is required (min 5 chars)");
      return;
    }
    if (!seat) {
      setError("Please select a seat on the map");
      return;
    }
    const classExtra = seatClass === "business" ? 400 : seatClass === "premium" ? 200 : 0;
    // Premium rows 1-3 on the map add $40
    const row = parseInt(seat, 10);
    const seatExtra = row <= 3 ? 40 : 0;
    const extras = classExtra + seatExtra + (baggage ? 50 : 0);
    setPending({
      ...pending,
      passenger,
      price: (pending.price || 0) + extras,
      // Store selection on pending for payment page (not typed but safe)
    });
    router.push("/payment");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold">Passenger details</h1>
        <div className="mt-2 text-sm text-slate-600">
          {pending.from} → {pending.to} on {pending.date} &middot; Flight {pending.flightId}{" "}
          &middot; <strong>${pending.price}</strong>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <div className="label">Passenger full name</div>
            <input
              id={dynId("book_name")}
              className="input"
              value={passenger}
              onChange={(e) => setPassenger(e.target.value)}
            />
          </div>
          <div>
            <div className="label">
              Passport / ID number{" "}
              <Tooltip content="Any alphanumeric string, minimum 5 characters">
                <span className="ml-1 text-xs text-slate-400 cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <input
              id={dynId("book_passport")}
              className="input"
              value={passport}
              onChange={(e) => setPassport(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Seat class</div>
            <select
              id={dynId("book_seat")}
              className="input"
              value={seatClass}
              onChange={(e) => setSeatClass(e.target.value)}
            >
              <option value="economy">Economy</option>
              <option value="premium">Premium economy (+$200)</option>
              <option value="business">Business (+$400)</option>
            </select>
          </div>

          <SeatMap flightId={pending.flightId!} value={seat} onChange={setSeat} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={baggage}
              onChange={(e) => setBaggage(e.target.checked)}
            />
            <span>Add checked baggage</span>
            <Tooltip content="Adds one 23kg checked bag for +$50">
              <span className="text-xs text-slate-400 cursor-help">(+$50 ⓘ)</span>
            </Tooltip>
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn-primary">
            Continue to payment
          </button>
        </form>
      </div>
    </div>
  );
}
