/**
 * Per-request test controls.
 *
 * Two independent knobs, both selected PER REQUEST (query string first, cookie
 * second) and never held in module/global state on the server:
 *
 *   ?variant=<name>   named breakage variant (see VARIANTS)
 *   ?delay=<spec>     determinism switch for randomDelay() (see parseDelay)
 *
 * Adding `&sticky=1` to either asks proxy.ts to mirror the value into a cookie
 * so it survives navigations that drop the query string. Without `sticky=1`
 * nothing is persisted — a request with no `?variant=` behaves exactly like the
 * site always has.
 *
 * This module is imported by both server and client code, so it must stay free
 * of `next/*` imports and of any mutable module-level state.
 */

export const VARIANTS = [
  "none",
  "id-rotation",
  "text-change",
  "type-change",
  "moved-container",
  "sibling-reorder",
  "element-removed",
] as const;

export type Variant = (typeof VARIANTS)[number];

export const VARIANT_COOKIE = "sqa_variant";
export const DELAY_COOKIE = "sqa_delay";

/** Suffix appended to ids / test attributes by the `id-rotation` variant. */
export const ROTATED_SUFFIX = "r2b9";

export function isVariant(v: unknown): v is Variant {
  return typeof v === "string" && (VARIANTS as readonly string[]).includes(v);
}

/** Unknown / missing values fall back to "none" — never throw on user input. */
export function parseVariant(raw: unknown): Variant {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return isVariant(v) ? v : "none";
}

export type DelayMode =
  | { kind: "default" }
  | { kind: "off" }
  | { kind: "fixed"; ms: number }
  | { kind: "seeded"; seed: number };

/**
 * Accepted `?delay=` values:
 *   off        — randomDelay() resolves immediately
 *   <ms>       — every randomDelay() waits exactly <ms> milliseconds (0-10000)
 *   seed:<n>   — same jitter distribution as today, but from a seeded PRNG so
 *                the sequence repeats run over run
 *
 * Returns null when the input is absent or unrecognised, so the caller can fall
 * through to the next source (cookie, then the app's historical behaviour).
 */
export function parseDelay(raw: unknown): DelayMode | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || v === "") return null;
  const s = v.trim().toLowerCase();
  if (s === "off" || s === "0ms" || s === "none") return { kind: "off" };
  if (s.startsWith("seed:")) {
    const n = Number.parseInt(s.slice(5), 10);
    return Number.isFinite(n) ? { kind: "seeded", seed: n >>> 0 } : null;
  }
  if (/^\d+$/.test(s)) {
    const ms = Number.parseInt(s, 10);
    if (ms === 0) return { kind: "off" };
    return { kind: "fixed", ms: Math.min(ms, 10_000) };
  }
  return null;
}

/** Deterministic 32-bit PRNG (mulberry32). Pure: same state in, same value out. */
export function mulberry32(state: number): { value: number; next: number } {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, next: a };
}
