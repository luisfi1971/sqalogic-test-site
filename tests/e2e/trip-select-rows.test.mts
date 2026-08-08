import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The DOM target for the canon's `table.selectRows`: select several rows, then
// run one action over the selection. Non-mutating — it opens the bulk dialog
// and backs out, so the shared fixture survives a re-run. The cancelling half
// is covered by the unit suite.

const TABLE = '[data-testid="trips-table"]';

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

async function rowIndex(reference: string): Promise<number> {
  return (await vibe.evaluate(`
    Array.from(document.querySelectorAll('${TABLE} tbody tr'))
      .findIndex(r => r.querySelector('td[data-col="reference"]').textContent.trim() === '${reference}') + 1
  `)) as number;
}

async function referenceOrder(): Promise<string[]> {
  return (await vibe.evaluate(`
    Array.from(document.querySelectorAll('${TABLE} tbody tr td[data-col="reference"]'))
      .map(td => td.textContent.trim())
  `)) as string[];
}

async function selectionCount(): Promise<string> {
  return (await vibe.evaluate(
    `document.querySelector('[data-testid="trips-selection-count"]').textContent.trim()`
  )) as string;
}

async function checkRow(reference: string) {
  const i = await rowIndex(reference);
  expect(i).toBeGreaterThan(0);
  await vibe.find(`${TABLE} tbody tr:nth-child(${i}) [data-testid="trip-select"]`).click();
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
  await vibe.go(`${BASE_URL}/my-trips`);
  await vibe.find(TABLE).waitUntil("visible");
});

describe("E2E: My Trips bulk selection", () => {
  it("E-12 selecting rows enables the bulk action and counts them", async () => {
    const disabledAtRest = (await vibe.evaluate(
      `document.querySelector('[data-testid="trips-cancel-selected"]').disabled`
    )) as boolean;
    expect(disabledAtRest).toBe(true);

    await checkRow("BK-DEMO2");
    await checkRow("BK-DEMO3");

    expect(await selectionCount()).toBe("2 selected");
    const enabled = (await vibe.evaluate(
      `document.querySelector('[data-testid="trips-cancel-selected"]').disabled === false`
    )) as boolean;
    expect(enabled).toBe(true);
  });

  it("E-13 the selection survives re-sorting, because it is keyed by reference", async () => {
    // BK-DEMO4 is first by date and second by price, so it genuinely moves — and
    // it stays above the fold, which matters: Vibium refuses a click on an
    // obscured element rather than scrolling to it first.
    // Picking a row that keeps its index (BK-DEMO2 does) would prove nothing.
    await checkRow("BK-DEMO4");
    const orderBefore = await referenceOrder();
    const before = await rowIndex("BK-DEMO4");

    await vibe.find('[data-sort-key="price"]').click();

    const orderAfter = await referenceOrder();
    const after = await rowIndex("BK-DEMO4");
    expect(orderAfter).not.toEqual(orderBefore); // the table really did re-sort
    expect(after).not.toBe(before); // ...and this row really did move
    expect(await selectionCount()).toBe("1 selected");
    const stillChecked = (await vibe.evaluate(`
      document.querySelector('${TABLE} tbody tr:nth-child(${after}) [data-testid="trip-select"]').checked
    `)) as boolean;
    expect(stillChecked).toBe(true);
  });

  it("E-14 select-all takes the page, and the bulk dialog lists what it will act on", async () => {
    await vibe.find('[data-testid="trips-select-all"]').click();
    expect(await selectionCount()).toBe("4 selected");

    await vibe.find('[data-testid="trips-cancel-selected"]').click();
    await vibe.find('[data-testid="bulk-cancel-modal-ok"]').waitUntil("visible");

    const listed = (await vibe.evaluate(
      `document.querySelector('[data-testid="bulk-cancel-list"]').textContent`
    )) as string;
    for (const ref of ["BK-DEMO1", "BK-DEMO2", "BK-DEMO3", "BK-DEMO4"]) {
      expect(listed).toContain(ref);
    }

    // Back out — nothing may actually be cancelled by this file.
    await vibe.find({ role: "button", text: "Keep them" }).click();
    // Assert the absence directly: find() throws on a missing element, so
    // find(...).waitUntil("detached") cannot be used once it has already gone.
    const gone = (await vibe.evaluate(
      `document.querySelectorAll('[data-testid="bulk-cancel-modal"]').length === 0`
    )) as boolean;
    expect(gone).toBe(true);
  });
});
