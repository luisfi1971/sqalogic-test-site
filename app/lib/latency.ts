/** Session key holding the latency-mode flag between page loads. */
export const LATENCY_KEY = "sqa_latency";

/**
 * Precedence for latency mode: an explicit `?latency=` in the URL always wins
 * and is remembered for the session; otherwise the remembered value applies.
 * That is what lets `?latency=1` survive the five client-side hops of the
 * booking flow while `?latency=0` still switches it off.
 */
export function resolveLatency(search: string, stored: string | null): boolean {
  const raw = new URLSearchParams(search).get("latency");
  if (raw !== null) return raw !== "0" && raw !== "false" && raw !== "";
  return stored === "1";
}

/** How far a price is off target on each tick before it converges. */
export const SETTLE_SWINGS = [43, 21, 8];

/**
 * A price on its way to the real one. There is deliberately no "settled" flag
 * anywhere in the DOM: the only honest way to read a price is to watch it hold
 * still, which is what `stableFor(cond, holdMs)` exists for. A suite that
 * scrapes the first number it sees books at a price the site never charged.
 */
export function settlePrice(price: number, step: number, index: number): number {
  if (step >= SETTLE_SWINGS.length) return price;
  const sign = (index + step) % 2 === 0 ? 1 : -1;
  return Math.max(50, price + sign * SETTLE_SWINGS[step]);
}
