"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking } from "../providers";
import Link from "next/link";
import { variantIds, type Variant } from "../lib/testControls";

function Inner({ variant = "none" }: { variant?: Variant }) {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id");
  const { bookings } = useBooking();
  const booking = bookings.find((b) => b.id === id);

  // --- per-request variant application (same pattern as SearchForm) ---------
  const { tid } = variantIds(variant);
  const heading = variant === "text-change" ? "Reservation complete" : "Booking confirmed!";
  const fakeLink = variant === "type-change";

  const referenceRowInner = (
    <div>
      Reference: <strong data-testid={tid("booking-ref")}>{booking?.id}</strong>
    </div>
  );

  // `moved-container` buries the reference row under two extra ancestors.
  const referenceRow =
    variant === "moved-container" ? (
      <section data-section="record">
        <div>{referenceRowInner}</div>
      </section>
    ) : (
      referenceRowInner
    );

  const passengerRow = (
    <div>
      Passenger: <span data-testid={tid("confirm-passenger")}>{booking?.passenger}</span>
    </div>
  );

  // `element-removed` deletes the seat row outright — the designated removed
  // element on this page.
  const seatRow =
    variant === "element-removed" ? null : (
      <div>
        Seat: <span data-testid={tid("confirm-seat")}>{booking?.seat || "—"}</span>
      </div>
    );

  // `sibling-reorder` swaps the Passenger and Seat rows in DOM order.
  const passengerAndSeat =
    variant === "sibling-reorder" ? (
      <>
        {seatRow}
        {passengerRow}
      </>
    ) : (
      <>
        {passengerRow}
        {seatRow}
      </>
    );

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-semibold text-green-700">{heading}</h1>
        {booking ? (
          <div className="mt-4 space-y-1 text-sm">
            {referenceRow}
            <div>Flight: <span data-testid={tid("confirm-flight")}>{booking.flightId}</span></div>
            <div>Route: {booking.from} → {booking.to}</div>
            <div>Date: {booking.date}</div>
            {passengerAndSeat}
            <div>
              Total charged:{" "}
              <strong data-testid={tid("confirm-total")}>${booking.price}</strong>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Booking {id} confirmed.</p>
        )}
        <div className="mt-6 flex gap-3">
          {/* `type-change` renders the primary CTA as a span[role=link] with the
              same accessible name instead of a real <a>. */}
          {fakeLink ? (
            <span
              role="link"
              tabIndex={0}
              className="btn-primary cursor-pointer"
              onClick={() => router.push("/my-trips")}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push("/my-trips");
              }}
            >
              View my trips
            </span>
          ) : (
            <Link href="/my-trips" className="btn-primary">View my trips</Link>
          )}
          <Link href="/search" className="btn-ghost">Book another</Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationClient({ variant = "none" }: { variant?: Variant }) {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <Inner variant={variant} />
    </Suspense>
  );
}
