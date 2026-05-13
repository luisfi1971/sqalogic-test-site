import { describe, it, expect } from "vitest";
import { launch, BASE_URL } from "./_helpers.mts";

describe("E2E: register validation", () => {
  it("E-03 shows error when passwords do not match", async () => {
    const { bro, vibe } = await launch();
    try {
      await vibe.go(`${BASE_URL}/register`);
      const nameEl = await vibe.find('[data-field="name"]');
      await nameEl.click();
      await nameEl.type("E03 User");
      const emailEl = await vibe.find('input[type="email"]');
      await emailEl.click();
      await emailEl.type(`test_e03_${Date.now()}@sqatest.local`);
      const pws = await vibe.findAll('input[type="password"]');
      await pws[0].click();
      await pws[0].type("abcdef1");
      await pws[1].click();
      await pws[1].type("different");
      await vibe.find({ role: "button", text: "Register" }).click();
      const err = await vibe.find('.text-red-600');
      expect((await err.text()).toLowerCase()).toContain("do not match");
      expect(await vibe.url()).toContain("/register");
    } finally {
      await bro.stop();
    }
  });
});
