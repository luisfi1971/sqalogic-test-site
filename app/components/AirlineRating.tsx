"use client";

import { createElement, useEffect } from "react";

export const AIRLINE_RATING_TAG = "airline-rating";

/**
 * A genuine custom element with a closed-off-looking (but open) shadow root.
 *
 * This is the target for the shadow-DOM row of the capability matrix. Until
 * something on the site lived behind a shadow boundary, that row was an
 * unverified claim — and the gap between "not supported" and "supported
 * silently badly" is exactly what the matrix exists to prevent.
 *
 * The stars are interactive on purpose: piercing to *read* is a much weaker
 * capability than piercing to *act*, and an engine can easily have one and not
 * the other.
 */
function defineAirlineRating() {
  if (typeof window === "undefined" || customElements.get(AIRLINE_RATING_TAG)) return;

  class AirlineRating extends HTMLElement {
    static observedAttributes = ["airline", "rating"];
    private root: ShadowRoot | null = null;

    connectedCallback() {
      if (!this.root) this.root = this.attachShadow({ mode: "open" });
      this.render();
    }

    attributeChangedCallback() {
      if (this.root) this.render();
    }

    private get rating() {
      return Number(this.getAttribute("rating") || "0");
    }

    private render() {
      const root = this.root!;
      const airline = this.getAttribute("airline") || "";
      const rating = this.rating;

      root.innerHTML = `
        <style>
          :host { display: inline-block; }
          .wrap { display: inline-flex; align-items: center; gap: 6px; }
          button {
            background: none; border: 0; padding: 0 1px; cursor: pointer;
            font-size: 15px; line-height: 1; color: #cbd5e1;
          }
          button[aria-pressed="true"] { color: #f59e0b; }
          .value { font-size: 12px; color: #64748b; }
        </style>
        <div class="wrap" role="group" aria-label="Rating for ${airline}">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) => `<button type="button" data-shadow-star="${n}"
                        aria-label="Rate ${n} out of 5"
                        aria-pressed="${n <= rating}">★</button>`
            )
            .join("")}
          <span class="value" data-shadow-rating-value>${rating}/5</span>
        </div>
      `;

      root.querySelectorAll<HTMLButtonElement>("[data-shadow-star]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = Number(btn.dataset.shadowStar);
          this.setAttribute("rating", String(next));
          this.dispatchEvent(
            new CustomEvent("rating-change", { detail: { airline, rating: next }, bubbles: true })
          );
        });
      });
    }
  }

  customElements.define(AIRLINE_RATING_TAG, AirlineRating);
}

export default function AirlineRating({
  airline,
  rating,
}: {
  airline: string;
  rating: number;
}) {
  useEffect(() => {
    defineAirlineRating();
  }, []);

  // createElement rather than JSX: the tag has no intrinsic-element typing, and
  // inventing one would be more ceremony than this deserves.
  return createElement(AIRLINE_RATING_TAG, {
    airline,
    rating: String(rating),
    "data-rating-for": airline,
  });
}
