import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The target for the canon's `fill.readBack: formatted | masked`. A naive
// read-back check — type X, assert the field now reads X — fails here every
// time, which is the point: it is the rule that makes `fill` provable in native
// contexts, and it needs a field that actually transforms its value.

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

const TYPED = "4242424242424242";

async function clickByText(re: RegExp) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    for (const b of await vibe.findAll("button")) {
      if (re.test(await b.text())) {
        await b.click();
        return;
      }
    }
    await vibe.wait(150);
  }
  throw new Error(`no button matching ${re} after 15s at ${await vibe.url()}`);
}

async function waitPath(p: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if ((await vibe.url()).includes(p)) return;
    await vibe.wait(150);
  }
  throw new Error(`timeout waiting for ${p}, url=${await vibe.url()}`);
}

async function valueOf(selector: string): Promise<string> {
  return (await vibe.evaluate(`document.querySelector('${selector}').value`)) as string;
}

/** Reach the payment step, which is where the masked fields live. */
async function gotoPayment() {
  await vibe.go(`${BASE_URL}/search`);
  await clickByText(/search flights|find flights/i);
  await waitPath("/results");
  await clickByText(/^Select$/);
  await waitPath("/book");

  const inputs = await vibe.findAll("form input");
  await inputs[1].click();
  await inputs[1].type("AB12345");
  const seatId = (await vibe.evaluate(
    `document.querySelector('[data-seat-status="free"]').getAttribute('data-seat-id')`
  )) as string;
  await vibe.find(`[data-seat-id="${seatId}"]`).click();

  await clickByText(/continue to payment/i);
  await waitPath("/payment");
  await vibe.find('[data-mask="card"]').waitUntil("visible");
}

beforeAll(async () => {
  ({ bro, vibe } = await launch());
  await vibe.go(`${BASE_URL}/login`);
  const emailEl = await vibe.find('input[type="email"]');
  await emailEl.click();
  await emailEl.type(DEMO.email);
  const pwEl = await vibe.find('input[type="password"]');
  await pwEl.click();
  await pwEl.type(DEMO.password);
  await vibe.find({ role: "button", text: "Sign in" }).click();
  await vibe.waitUntil.url(`${BASE_URL}/search`);
});

afterAll(async () => {
  await bro?.stop();
});

beforeEach(async () => {
  await gotoPayment();
});

describe("E2E: masked payment fields", () => {
  it("E-27 the card field reads back formatted, not as typed", async () => {
    const el = await vibe.find('[data-mask="card"]');
    await el.click();
    await el.type(TYPED);

    const readBack = await valueOf('[data-mask="card"]');
    expect(readBack).toBe("4242 4242 4242 4242");
    // The naive assertion an engine would write first, and why it must not:
    expect(readBack).not.toBe(TYPED);
  });

  it("E-28 leaving the field masks it, giving a third string again", async () => {
    const el = await vibe.find('[data-mask="card"]');
    await el.click();
    await el.type(TYPED);
    const formatted = await valueOf('[data-mask="card"]');

    // Blur by moving to the next field, as a person would.
    const name = await vibe.find('[id^="pay_name"]');
    await name.click();

    const masked = await valueOf('[data-mask="card"]');
    expect(masked).toBe("•••• •••• •••• 4242");
    expect(masked).not.toBe(formatted);
    expect(masked).not.toBe(TYPED);
  });

  it("E-29 the expiry gains its slash on its own", async () => {
    const el = await vibe.find('[data-mask="expiry"]');
    await el.click();
    await el.type("1228");
    expect(await valueOf('[data-mask="expiry"]')).toBe("12/28");
  });

  it("E-30 an impossible month is clamped rather than accepted", async () => {
    const el = await vibe.find('[data-mask="expiry"]');
    await el.click();
    await el.type("9928");
    expect(await valueOf('[data-mask="expiry"]')).toBe("12/28");
  });

  it("E-31 the masked value still pays — the digits behind it survived", async () => {
    const card = await vibe.find('[data-mask="card"]');
    await card.click();
    await card.type(TYPED);
    const exp = await vibe.find('[data-mask="expiry"]');
    await exp.click();
    await exp.type("1228");
    const cvv = await vibe.find('[id^="pay_cvv"]');
    await cvv.click();
    await cvv.type("123");

    await vibe.find('[data-testid="pay-submit"]').click();
    await vibe.find('[data-testid="confirm-modal-ok"]').waitUntil("visible");

    // The receipt shows the last four, which proves the raw digits were kept
    // rather than replaced by the bullets on screen.
    const summary = (await vibe.evaluate(
      `document.querySelector('[data-testid="confirm-modal"]').textContent`
    )) as string;
    expect(summary).toContain("4242");

    // Back out: this file must not create bookings.
    await vibe.find({ role: "button", text: "Cancel" }).click();
  });
});
