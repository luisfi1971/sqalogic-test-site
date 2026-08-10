import { describe, it, expect } from "vitest";
import {
  VARIANTS,
  mulberry32,
  parseDelay,
  parseVariant,
} from "@app/lib/testControls";

describe("parseVariant", () => {
  it("U-30 accepts every published variant name", () => {
    for (const v of VARIANTS) expect(parseVariant(v)).toBe(v);
  });

  it("U-31 falls back to none for unknown, missing or hostile input", () => {
    for (const bad of [undefined, null, "", "bogus", 42, {}, "ID-ROTATION"]) {
      expect(parseVariant(bad)).toBe("none");
    }
  });

  it("U-32 takes the first value when the parameter repeats", () => {
    expect(parseVariant(["text-change", "element-removed"])).toBe("text-change");
  });
});

describe("parseDelay", () => {
  it("U-33 returns null when absent so the caller keeps the historical behaviour", () => {
    for (const raw of [undefined, null, "", "sometimes", "seed:abc"]) {
      expect(parseDelay(raw)).toBeNull();
    }
  });

  it("U-34 parses the off spellings", () => {
    for (const raw of ["off", "OFF", " none ", "0", "0ms"]) {
      expect(parseDelay(raw)).toEqual({ kind: "off" });
    }
  });

  it("U-35 parses a fixed millisecond value and caps it", () => {
    expect(parseDelay("250")).toEqual({ kind: "fixed", ms: 250 });
    expect(parseDelay("999999")).toEqual({ kind: "fixed", ms: 10_000 });
  });

  it("U-36 parses a seed", () => {
    expect(parseDelay("seed:42")).toEqual({ kind: "seeded", seed: 42 });
  });
});

describe("mulberry32", () => {
  it("U-37 is deterministic: the same seed replays the same sequence", () => {
    const run = (seed: number, n: number) => {
      let state = seed;
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        const r = mulberry32(state);
        out.push(r.value);
        state = r.next;
      }
      return out;
    };
    expect(run(42, 6)).toEqual(run(42, 6));
    expect(run(42, 6)).not.toEqual(run(43, 6));
  });

  it("U-38 stays inside [0, 1)", () => {
    let state = 7;
    for (let i = 0; i < 200; i++) {
      const r = mulberry32(state);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      state = r.next;
    }
  });
});
