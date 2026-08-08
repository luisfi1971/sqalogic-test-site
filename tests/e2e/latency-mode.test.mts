import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// Latency mode is what makes the canon's wait conditions provable. On an
// instantaneous site a bad wait passes, so nothing tells you it is bad — which
// is exactly how a suite goes falsely green and how the pressure for a
// sleep(ms) escape hatch comes back.
//
// Every assertion below waits on state, never on elapsed time. The one fixed
// interval in this file is a polling cadence inside a stableFor loop, where the
// verdict still comes from the value holding still.

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

const TABLE = '[data-testid="trips-table"]';
const RESTORE_ID = "BK-DEMO4";

async function signIn() {
  await vibe.go(`${BASE_URL}/login?latency=1`);
  const emailEl = await vibe.find('input[type="email"]');
  await emailEl.click();
  await emailEl.type(DEMO.email);
  const pwEl = await vibe.find('input[type="password"]');
  await pwEl.click();
  await pwEl.type(DEMO.password);
  await vibe.find({ role: "button", text: "Sign in" }).click();
  await vibe.waitUntil.url(`${BASE_URL}/search`);
}

/** Put the fixture back after the one test that mutates it. */
async function restoreTrip(id: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { error } = await sb.from("bookings").update({ status: "active" }).eq("id", id);
  if (error) throw new Error(`could not restore ${id}: ${error.message}`);
}

beforeAll(async () => {
  ({ bro, vibe } = await launch());
  await signIn();
});

afterAll(async () => {
  await bro?.stop();
});

describe("E2E: latency mode", () => {
  it("E-07 the search spinner appears and then goes — spinnerGone has a target", async () => {
    await vibe.go(`${BASE_URL}/results?from=YUL+-+Montreal&to=JFK+-+New+York&date=2026-09-01`);

    // It must actually be there to be waited on, otherwise `spinnerGone`
    // passes vacuously on a page that never had a spinner.
    await vibe.find('[data-testid="spinner"]').waitUntil("visible");
    await vibe.find('[data-testid="spinner"]').waitUntil("detached");

    const flights = (await vibe.evaluate(
      `document.querySelectorAll('[data-flight-id]').length`
    )) as number;
    expect(flights).toBeGreaterThan(0);
  });

  it("E-08 prices churn before they hold still — stableFor has a target", async () => {
    await vibe.go(`${BASE_URL}/results?from=YUL+-+Montreal&to=LHR+-+London&date=2026-09-02`);
    await vibe.find('[data-testid="spinner"]').waitUntil("detached");

    const readFirstPrice = async () =>
      (await vibe.evaluate(`document.querySelector('[data-price-for]').textContent.trim()`)) as string;

    // stableFor, written out: poll until the value has held across N reads.
    // The interval below is a polling cadence, not a sleep-and-hope — the
    // assertion is on the value holding, never on time having passed.
    const firstRead = await readFirstPrice();
    let stable = "";
    let holds = 0;
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const v = await readFirstPrice();
      if (v === stable) {
        if (++holds >= 4) break;
      } else {
        stable = v;
        holds = 0;
      }
      await vibe.wait(120);
    }

    expect(holds).toBeGreaterThanOrEqual(4);
    // The point of the exercise: the first number on screen was not the price.
    expect(firstRead).not.toBe(stable);
    expect(stable).toMatch(/^\$\d+$/);
  });

  it("E-09 cancelling raises a toast that arrives late and then leaves", async () => {
    await vibe.go(`${BASE_URL}/my-trips`);
    await vibe.find(TABLE).waitUntil("visible");

    const index = (await vibe.evaluate(`
      Array.from(document.querySelectorAll('${TABLE} tbody tr'))
        .findIndex(r => r.querySelector('td[data-col="reference"]').textContent.trim() === '${RESTORE_ID}') + 1
    `)) as number;
    expect(index).toBeGreaterThan(0);

    try {
      await vibe.find(`${TABLE} tbody tr:nth-child(${index}) [data-testid="trip-cancel"]`).click();
      await vibe.find('[data-testid="confirm-modal-ok"]').waitUntil("visible");
      await vibe.find('[data-testid="confirm-modal-ok"]').click();

      // In latency mode the toast lands ~900ms after the action, so asserting
      // immediately would miss it. Wait for it to exist, do not sleep for it.
      await vibe.find('[data-testid="toast"]').waitUntil("visible");
      const [text, kind] = (await vibe.evaluate(`
        (() => {
          const t = document.querySelector('[data-testid="toast"]');
          return [t.textContent, t.getAttribute('data-toast-kind')];
        })()
      `)) as [string, string];
      expect(text).toContain(`Trip ${RESTORE_ID} cancelled`);
      expect(kind).toBe("info");

      // It auto-dismisses, so `gone` is provable too.
      await vibe.find('[data-testid="toast"]').waitUntil("detached");
    } finally {
      await restoreTrip(RESTORE_ID);
    }
  });

  it("E-10 latency mode survives a client-side hop without the param", async () => {
    await vibe.go(`${BASE_URL}/results?from=YUL+-+Montreal&to=CDG+-+Paris&date=2026-09-03`);
    // No ?latency= on this URL — the session carries it, so the spinner is
    // still there.
    await vibe.find('[data-testid="spinner"]').waitUntil("visible");
    await vibe.find('[data-testid="spinner"]').waitUntil("detached");
  });

  it("E-11 ?latency=0 switches the site back to instantaneous", async () => {
    await vibe.go(`${BASE_URL}/results?from=YUL+-+Montreal&to=MAD+-+Madrid&date=2026-09-04&latency=0`);
    await vibe.find("[data-flight-id]").waitUntil("visible");
    const spinners = (await vibe.evaluate(
      `document.querySelectorAll('[data-testid="spinner"]').length`
    )) as number;
    expect(spinners).toBe(0);
  });
});
