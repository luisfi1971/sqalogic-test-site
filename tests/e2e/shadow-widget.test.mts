import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL } from "./_helpers.mts";

// The target for the shadow-DOM row of the capability matrix. Until something
// on this site lived behind a shadow boundary, that row was an unverified
// claim — and the gap between "not supported" and "supported silently badly" is
// exactly what the matrix exists to prevent.
//
// The stars are interactive on purpose: piercing to *read* is a much weaker
// capability than piercing to *act*, and an engine can have one without the
// other.

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

const RESULTS = `${BASE_URL}/results?from=YUL+-+Montreal&to=JFK+-+New+York&date=2026-10-01`;

beforeAll(async () => {
  ({ bro, vibe } = await launch());
});

afterAll(async () => {
  await bro?.stop();
});

beforeEach(async () => {
  await vibe.go(RESULTS);
  await vibe.find("airline-rating").waitUntil("visible");
});

describe("E2E: airline rating widget in shadow DOM", () => {
  it("E-32 it is a real custom element, upgraded and carrying a shadow root", async () => {
    const probe = (await vibe.evaluate(`
      (() => {
        const el = document.querySelector('airline-rating');
        return [
          !!customElements.get('airline-rating'),
          !!el.shadowRoot,
          el.shadowRoot ? el.shadowRoot.querySelectorAll('[data-shadow-star]').length : 0
        ];
      })()
    `)) as [boolean, boolean, number];
    expect(probe).toEqual([true, true, 5]);
  });

  it("E-33 the stars are invisible to a light-DOM query", async () => {
    // This is the assertion that makes the row meaningful: an engine that
    // cannot pierce sees nothing here, rather than seeing something wrong.
    const inLightDom = (await vibe.evaluate(
      `document.querySelectorAll('[data-shadow-star]').length`
    )) as number;
    expect(inLightDom).toBe(0);

    const insideShadow = (await vibe.evaluate(
      `document.querySelector('airline-rating').shadowRoot.querySelectorAll('[data-shadow-star]').length`
    )) as number;
    expect(insideShadow).toBe(5);
  });

  it("E-34 clicking a star inside the shadow root changes the reading", async () => {
    const before = (await vibe.evaluate(`
      document.querySelector('airline-rating').shadowRoot
        .querySelector('[data-shadow-rating-value]').textContent
    `)) as string;

    await vibe.evaluate(`
      document.querySelector('airline-rating').shadowRoot
        .querySelector('[data-shadow-star="5"]').click()
    `);

    const after = (await vibe.evaluate(`
      document.querySelector('airline-rating').shadowRoot
        .querySelector('[data-shadow-rating-value]').textContent
    `)) as string;

    expect(after).toBe("5/5");
    expect(after).not.toBe(before);
  });

  it("E-35 the pressed state follows the rating, so aria is not decorative", async () => {
    await vibe.evaluate(`
      document.querySelector('airline-rating').shadowRoot
        .querySelector('[data-shadow-star="3"]').click()
    `);

    const pressed = (await vibe.evaluate(`
      Array.from(document.querySelector('airline-rating').shadowRoot
        .querySelectorAll('[data-shadow-star]'))
        .map(b => b.getAttribute('aria-pressed'))
    `)) as string[];
    expect(pressed).toEqual(["true", "true", "true", "false", "false"]);
  });

  it("E-36 every flight row carries its own widget, addressable by airline", async () => {
    const count = (await vibe.evaluate(`document.querySelectorAll('airline-rating').length`)) as number;
    expect(count).toBeGreaterThanOrEqual(6);

    // Each one is scoped to its own airline, so a rating set on one row cannot
    // be read off another.
    const airlines = (await vibe.evaluate(
      `Array.from(document.querySelectorAll('airline-rating')).map(el => el.getAttribute('airline'))`
    )) as string[];
    expect(airlines.every((a) => a && a.length > 0)).toBe(true);
  });
});
