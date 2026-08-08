import { describe, it, expect } from "vitest";
import { digitsOf, formatCard, formatExpiry, lastFour, maskCard } from "@app/lib/mask";

const TYPED = "4242424242424242";

describe("card formatting", () => {
  it("U-50 what you type is not what you read back — that is the whole point", () => {
    expect(formatCard(TYPED)).toBe("4242 4242 4242 4242");
    expect(formatCard(TYPED)).not.toBe(TYPED);
  });

  it("U-50a re-formatting an already formatted value is stable", () => {
    // Every keystroke re-runs this, so it must not drift.
    expect(formatCard(formatCard(TYPED))).toBe(formatCard(TYPED));
  });

  it("U-50b a partial number formats as far as it goes, with no trailing space", () => {
    expect(formatCard("4242")).toBe("4242");
    expect(formatCard("42424")).toBe("4242 4");
    expect(formatCard("")).toBe("");
  });

  it("U-50c non-digits are dropped rather than displayed", () => {
    expect(formatCard("4242-4242 4242abc4242")).toBe("4242 4242 4242 4242");
  });
});

describe("card masking", () => {
  it("U-51 masking gives back a third string, different again from typed and formatted", () => {
    const masked = maskCard(TYPED);
    expect(masked).toBe("•••• •••• •••• 4242");
    expect(masked).not.toBe(TYPED);
    expect(masked).not.toBe(formatCard(TYPED));
  });

  it("U-51a only the last four survive", () => {
    expect(maskCard(TYPED).endsWith("4242")).toBe(true);
    expect(maskCard(TYPED).replace(/[^•]/g, "")).toHaveLength(12);
  });

  it("U-51b four digits or fewer have nothing to hide yet", () => {
    expect(maskCard("4242")).toBe("4242");
    expect(maskCard("42")).toBe("42");
  });

  it("U-51c the raw digits are always recoverable from what was typed", () => {
    // The form validates digitsOf(raw), never the displayed string — a mask
    // that ate the value would break the payment, not just the read-back.
    expect(digitsOf(TYPED)).toBe(TYPED);
    expect(lastFour(TYPED)).toBe("4242");
  });
});

describe("expiry formatting", () => {
  it("U-52 inserts the slash for you", () => {
    expect(formatExpiry("1228")).toBe("12/28");
    expect(formatExpiry("12/28")).toBe("12/28");
  });

  it("U-52a builds up sensibly while typing", () => {
    expect(formatExpiry("")).toBe("");
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("122")).toBe("12/2");
  });

  it("U-52b clamps an impossible month instead of accepting it", () => {
    expect(formatExpiry("9928")).toBe("12/28");
    expect(formatExpiry("0028")).toBe("01/28");
  });

  it("U-52c ignores anything past four digits", () => {
    expect(formatExpiry("12281234")).toBe("12/28");
  });
});
