"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBooking } from "../providers";
import Link from "next/link";

function Inner() {
  const sp = useSearchParams();
  const id = sp.get("id");
  const { bookings } = useBooking();
  const booking = bookings.find((b) => b.id === id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold text-green-700">Booking confirmed!</h1>
        {booking ? (
          <div className="mt-4 space-y-1 text-sm">
            <div>Reference: <strong data-testid="booking-ref">{booking.id}</strong></div>
            <div>Flight: {booking.flightId}</div>
            <div>Route: {booking.from} → {booking.to}</div>
            <div>Date: {booking.date}</div>
            <div>Passenger: {booking.passenger}</div>
            <div>Total charged: <strong>${booking.price}</strong></div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Booking {id} confirmed.</p>
        )}
        <div className="mt-6 flex gap-3">
          <Link href="/my-trips" className="btn-primary">View my trips</Link>
          <Link href="/search" className="btn-ghost">Book another</Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Inner />
    </Suspense>
  );
}
