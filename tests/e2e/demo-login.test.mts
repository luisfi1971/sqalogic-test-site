import { describe, it, expect } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

describe("E2E: demo login flow", () => {
  it("E-02 demo user logs in and sees 3 seeded trips", async () => {
    const { bro, vibe } = await launch();
    try {
      await vibe.go(`${BASE_URL}/login`);
      const emailEl = await vibe.find('input[type="email"]');
      await emailEl.click();
      await emailEl.type(DEMO.email);
      const pwEl = await vibe.find('input[type="password"]');
      await pwEl.click();
      await pwEl.type(DEMO.password);
      await vibe.find({ role: "button", text: "Sign in" }).click();
      try {
        await vibe.waitUntil.url(`${BASE_URL}/search`);
      } catch (e) {
        const html = await vibe.content();
        const err = html.match(/text-red-600[^>]*>([^<]+)</)?.[1];
        throw new Error(`Login did not redirect. URL=${await vibe.url()} error=${err}`);
      }

      await vibe.go(`${BASE_URL}/my-trips`);
      await vibe.find('[data-testid="trips-table"]').waitUntil("visible");
      const refs = (await vibe.evaluate(
        `Array.from(document.querySelectorAll('[data-testid="trips-table"] tbody tr td[data-col="reference"]')).map(td => td.textContent.trim())`
      )) as string[];
      expect(refs.length).toBeGreaterThanOrEqual(3);
      expect(refs).toEqual(
        expect.arrayContaining(["BK-DEMO1", "BK-DEMO2", "BK-DEMO3"])
      );
    } finally {
      await bro.stop();
    }
  });
});
