import { describe, it, expect } from "vitest";
import { LATENCY_KEY, SETTLE_SWINGS, resolveLatency, settlePrice } from "@app/lib/latency";

describe("latency mode resolution", () => {
  it("U-20 is off when neither the URL nor the session says otherwise", () => {
    expect(resolveLatency("", null)).toBe(false);
    expect(resolveLatency("?from=YUL", null)).toBe(false);
  });

  it("U-20a ?latency=1 turns it on", () => {
    expect(resolveLatency("?latency=1", null)).toBe(true);
    expect(resolveLatency("?from=YUL&latency=1&to=JFK", null)).toBe(true);
  });

  it("U-20b a bare ?latency turns it off, since it carries no value", () => {
    // `?latency` with no value parses as "", which we treat as off rather than
    // guessing — an explicit 1 is required to slow the site down.
    expect(resolveLatency("?latency", null)).toBe(false);
    expect(resolveLatency("?latency=", null)).toBe(false);
  });

  it("U-20c ?latency=0 and ?latency=false turn it off", () => {
    expect(resolveLatency("?latency=0", "1")).toBe(false);
    expect(resolveLatency("?latency=false", "1")).toBe(false);
  });

  it("U-20d the session value carries the mode across client-side hops", () => {
    // /results and /payment carry no param of their own.
    expect(resolveLatency("?from=YUL&to=JFK", "1")).toBe(true);
    expect(resolveLatency("", "1")).toBe(true);
    expect(resolveLatency("", "0")).toBe(false);
  });

  it("U-20e an explicit param always beats the remembered value", () => {
    expect(resolveLatency("?latency=1", "0")).toBe(true);
    expect(resolveLatency("?latency=0", "1")).toBe(false);
  });

  it("U-20f the session key is the one the provider writes", () => {
    expect(LATENCY_KEY).toBe("sqa_latency");
  });
});

describe("price settling", () => {
  const PRICE = 320;

  it("U-21 the final step is the real price", () => {
    expect(settlePrice(PRICE, SETTLE_SWINGS.length, 0)).toBe(PRICE);
    expect(settlePrice(PRICE, SETTLE_SWINGS.length + 5, 3)).toBe(PRICE);
  });

  it("U-21a every earlier step is wrong, so a first read is a wrong read", () => {
    for (let step = 0; step < SETTLE_SWINGS.length; step++) {
      expect(settlePrice(PRICE, step, 0)).not.toBe(PRICE);
    }
  });

  it("U-21b the error shrinks monotonically towards the real price", () => {
    const errors = SETTLE_SWINGS.map((_, step) => Math.abs(settlePrice(PRICE, step, 0) - PRICE));
    for (let i = 1; i < errors.length; i++) {
      expect(errors[i]).toBeLessThan(errors[i - 1]);
    }
  });

  it("U-21c neighbouring rows swing in opposite directions", () => {
    // So the list visibly churns rather than sliding as one block.
    const a = settlePrice(PRICE, 0, 0) - PRICE;
    const b = settlePrice(PRICE, 0, 1) - PRICE;
    expect(Math.sign(a)).toBe(-Math.sign(b));
  });

  it("U-21d it is a pure function of its inputs, so a settled read is repeatable", () => {
    expect(settlePrice(PRICE, 1, 2)).toBe(settlePrice(PRICE, 1, 2));
  });

  it("U-21e a cheap fare never displays as an absurd number", () => {
    expect(settlePrice(60, 0, 1)).toBeGreaterThanOrEqual(50);
  });
});
