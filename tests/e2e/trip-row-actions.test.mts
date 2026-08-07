import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The DOM target for the canon's `table.actInRow` composite: locate the row
// where a column equals a value, then act on a control inside *that* row.
//
// Deliberately non-mutating: it opens the cancel dialog and backs out. A test
// that actually cancelled a seeded trip would leave the shared fixture with a
// disabled Cancel button and could not be re-run until the keep-alive task
// restored it. The cancel path itself is covered by the unit suite.
//
// One browser and one login for the whole file: three cold launches inside a
// 60s testTimeout is where this file first went flaky, and a flaky test in the
// bed that exists to prove flake-free waiting would be a poor joke.

const TABLE = '[data-testid="trips-table"]';

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

/** Row-where, evaluated in the page exactly as an engine would resolve it. */
async function rowWhere(value: string): Promise<{ count: number; index: number }> {
  const hits = (await vibe.evaluate(`
    Array.from(document.querySelectorAll('${TABLE} tbody tr'))
      .map((r, i) => Array.from(r.querySelectorAll('td')).some(td => td.textContent.trim() === ${JSON.stringify(value)}) ? i + 1 : 0)
      .filter(Boolean)
  `)) as number[];
  return { count: hits.length, index: hits[0] ?? -1 };
}

async function dialogText(testId: string): Promise<string> {
  return (await vibe.evaluate(
    `document.querySelector('[data-testid="${testId}"]').textContent`
  )) as string;
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

// Fresh page per test, so a dialog left open cannot leak into the next one.
beforeEach(async () => {
  await vibe.go(`${BASE_URL}/my-trips`);
  await vibe.find(TABLE).waitUntil("visible");
});

describe("E2E: My Trips row actions", () => {
  it("E-04 acts on the control inside the row where Reference = BK-DEMO2", async () => {
    const target = await rowWhere("BK-DEMO2");
    expect(target.count).toBe(1); // matchCount === 1 — safe to act

    await vibe.find(`${TABLE} tbody tr:nth-child(${target.index}) [data-testid="trip-cancel"]`).click();
    await vibe.find('[data-testid="confirm-modal"]').waitUntil("visible");
    expect(await dialogText("confirm-modal")).toContain("BK-DEMO2");

    // Back out — the fixture must survive the run.
    await vibe.find({ role: "button", text: "Keep trip" }).click();
    const stillActive = (await vibe.evaluate(`
      Array.from(document.querySelectorAll('${TABLE} tbody tr'))
        .find(r => r.querySelector('td').textContent.trim() === 'BK-DEMO2')
        .textContent.includes('Active')
    `)) as boolean;
    expect(stillActive).toBe(true);
  });

  it("E-05 row-where on a duplicated column stays ambiguous", async () => {
    // Two seeded trips share this destination on purpose, mirroring the
    // RegressAir duplication on /results. An engine must refuse to act here and
    // disambiguate by a second column instead.
    expect((await rowWhere("JFK - New York")).count).toBe(2);
    expect((await rowWhere("2026-09-08")).count).toBe(1);
  });

  it("E-06 View opens the details dialog for that row", async () => {
    const target = await rowWhere("BK-DEMO3");
    expect(target.count).toBe(1);

    await vibe.find(`${TABLE} tbody tr:nth-child(${target.index}) [data-testid="trip-view"]`).click();
    await vibe.find('[data-testid="trip-details-modal"]').waitUntil("visible");

    const text = await dialogText("trip-details-modal");
    expect(text).toContain("BK-DEMO3");
    expect(text).toContain("GRU - Sao Paulo");
    expect(text).not.toContain("BK-DEMO1");
  });
});
