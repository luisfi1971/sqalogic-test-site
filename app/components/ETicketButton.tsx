"use client";

import type { Booking } from "../providers";
import { buildETicketPdf, eTicketFilename, triggerDownload } from "../lib/pdf";

/**
 * The target for the canon's `download.verify`. The booking reference is in the
 * filename, so a suite can capture the reference on the confirmation page and
 * then prove the file it downloaded is the ticket for that booking.
 */
export default function ETicketButton({
  booking,
  reference,
  className = "btn-ghost",
  label = "Download e-ticket",
}: {
  booking?: Booking | null;
  reference: string;
  className?: string;
  label?: string;
}) {
  const onClick = () => {
    const fields = booking
      ? [
          { label: "Passenger", value: booking.passenger },
          { label: "Flight", value: booking.flightId },
          { label: "Route", value: `${booking.from} -> ${booking.to}` },
          { label: "Date", value: booking.date },
          { label: "Seat", value: booking.seat || "unassigned" },
          { label: "Checked bag", value: booking.baggage ? "Yes" : "No" },
          { label: "Total", value: `$${booking.price}` },
          { label: "Status", value: booking.status === "cancelled" ? "Cancelled" : "Active" },
        ]
      : [{ label: "Status", value: "Confirmed" }];

    triggerDownload(eTicketFilename(reference), buildETicketPdf(reference, fields));
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      data-testid="download-eticket"
      data-eticket-for={reference}
    >
      {label}
    </button>
  );
}
