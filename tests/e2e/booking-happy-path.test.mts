import { describe, it, expect } from "vitest";
import { launch, BASE_URL, uniqueEmail } from "./_helpers.mts";

describe("E2E: end-to-end booking happy path", () => {
  it("E-01 register → search → book → pay → confirmation → my-trips", async () => {
    const { bro, vibe } = await launch();
    const step = async (label: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (e) {
        throw new Error(`Step "${label}" failed at ${await vibe.url()}: ${(e as Error).message}`);
      }
    };
    try {
      const email = uniqueEmail("e01");
      const password = "secret123";

      const typeInto = async (selector: string, text: string) => {
        const el = await vibe.find(selector);
        await el.click();
        await el.type(text);
      };

      // Register
      await vibe.go(`${BASE_URL}/register`);
      await typeInto('[data-field="name"]', "E01 User");
      await typeInto('input[type="email"]', email);
      const pws = await vibe.findAll('input[type="password"]');
      await pws[0].click(); await pws[0].type(password);
      await pws[1].click(); await pws[1].type(password);
      await vibe.find({ role: "button", text: "Register" }).click();
      await vibe.waitUntil.url(`${BASE_URL}/search`);

      // Search — click submit and wait for client-side route change
      const clickByText = async (re: RegExp) => {
        const btns = await vibe.findAll("button");
        for (const b of btns) {
          if (re.test(await b.text())) {
            await b.click();
            return;
          }
        }
        throw new Error(`no button matching ${re}`);
      };
      const waitPath = async (p: string) => {
        const start = Date.now();
        while (Date.now() - start < 15000) {
          if ((await vibe.url()).includes(p)) return;
          await vibe.wait(150); // FIXME: replace with proper wait — waitUntil eval not firing on client-side route change
        }
        throw new Error(`timeout waiting for path ${p}, url=${await vibe.url()}`);
      };

      await step("click search", () => clickByText(/search flights|find flights/i));
      await step("wait /results", () => waitPath("/results"));
      await step("click Select", () => clickByText(/^Select$/));
      await step("wait /book", () => waitPath("/book"));

      // Fill passport + pick a seat (passenger prefilled from user)
      await step("fill passport", async () => {
        const inputs = await vibe.findAll("form input");
        // [0]=name (prefilled), [1]=passport
        await inputs[1].click();
        await inputs[1].type("AB12345");
      });
      await step("pick free seat", async () => {
        const seatId = (await vibe.evaluate(
          `document.querySelector('[data-seat-status="free"]').getAttribute('data-seat-id')`
        )) as string;
        await vibe.find(`[data-seat-id="${seatId}"]`).click();
      });

      await step("click Continue", () => clickByText(/continue to payment/i));
      await step("wait /payment", () => waitPath("/payment"));

      // Fill payment (release 1: plain inputs)
      await typeInto('input[placeholder*="4242"]', "4242424242424242");
      await typeInto('input[placeholder="12/28"]', "12/28");
      await typeInto('input[placeholder="123"]', "123");
      await vibe.find('[data-testid="pay-submit"]').click();

      // Confirm modal
      await vibe.find('[data-testid="confirm-modal-ok"]').click();

      // Confirmation page — auto-wait via find
      const ref = await vibe.find('[data-testid="booking-ref"]');
      const bookingId = (await ref.text()).trim();
      expect(bookingId).toMatch(/^BK-/);

      // My trips shows it
      await vibe.go(`${BASE_URL}/my-trips`);
      await vibe.find('[data-testid="trips-table"]').waitUntil("visible");
      const html = await vibe.content();
      expect(html).toContain(bookingId);
    } finally {
      await bro.stop();
    }
  });
});
