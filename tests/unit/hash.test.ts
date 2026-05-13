import { describe, it, expect } from "vitest";
import { sha256 } from "@app/lib/hash";

describe("sha256()", () => {
  it("U-01 matches demo password hash from migration 0002", async () => {
    expect(await sha256("demo123")).toBe(
      "d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791"
    );
  });

  it("U-02 hashes empty string to 64 hex chars", async () => {
    const h = await sha256("");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("U-03 handles unicode and emoji", async () => {
    const h = await sha256("café🔥");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("U-04 handles long strings (>10KB) without error", async () => {
    const h = await sha256("x".repeat(20_000));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("U-05 is case-sensitive", async () => {
    expect(await sha256("A")).not.toBe(await sha256("a"));
  });

  it("U-05b is deterministic across calls", async () => {
    expect(await sha256("abc")).toBe(await sha256("abc"));
  });
});
