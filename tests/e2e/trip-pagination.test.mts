import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL, DEMO } from "./_helpers.mts";

// The target for the canon's `table.paginate`. My Trips paged before this, but
// with four seeded trips it always said "Page 1 of 1" — the control existed and
// never did anything, which is the worst kind of target: one that passes
// without exercising.

const TABLE = '[data-testid="trips-table"]';

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

async function referencesOnPage(): Promise<string[]> {
  return (await vibe.evaluate(`
    Array.from(document.querySelectorAll('${TABLE} tbody tr td[data-col="reference"]'))
      .map(td => td.textContent.trim())
  `)) as string[];
}

async function pageLabel(): Promise<string> {
  return (await vibe.evaluate(
    `Array.from(document.querySelectorAll('div')).find(d => /^Page \\d+ of \\d+$/.test(d.textContent.trim())).textContent.trim()`
  )) as string;
}

async function navDisabled(which: "prev" | "next"): Promise<boolean> {
  return (await vibe.evaluate(
    `document.querySelector('[data-testid="trips-${which}"]').disabled`
  )) as boolean;
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

describe("E2E: My Trips pagination", () => {
  it("E-22 there is genuinely more than one page", async () => {
    const label = await pageLabel();
    expect(label).toMatch(/^Page 1 of [2-9]\d*$/);
    expect(await navDisabled("prev")).toBe(true);
    expect(await navDisabled("next")).toBe(false);
  });

  it("E-23 Next shows a different set of rows, with no overlap", async () => {
    const first = await referencesOnPage();
    await vibe.find('[data-testid="trips-next"]').click();

    const second = await referencesOnPage();
    expect(second.length).toBeGreaterThan(0);
    expect(second).not.toEqual(first);
    // Overlap would mean a row is reachable twice, which breaks any
    // walk-every-page traversal.
    expect(second.filter((r) => first.includes(r))).toEqual([]);
    expect(await pageLabel()).toMatch(/^Page 2 of /);
  });

  it("E-24 walking every page reaches each trip exactly once", async () => {
    const seen: string[] = [];
    const totalPages = Number((await pageLabel()).match(/of (\d+)$/)![1]);

    for (let p = 1; p <= totalPages; p++) {
      seen.push(...(await referencesOnPage()));
      if (p < totalPages) await vibe.find('[data-testid="trips-next"]').click();
    }

    expect(await navDisabled("next")).toBe(true);
    expect(new Set(seen).size).toBe(seen.length); // no duplicates
    expect(seen.length).toBeGreaterThanOrEqual(13);
    for (const ref of ["BK-DEMO1", "BK-DEMO4", "BK-DEMO13"]) {
      expect(seen).toContain(ref);
    }
  });

  it("E-25 Prev walks back to where it started", async () => {
    const first = await referencesOnPage();
    await vibe.find('[data-testid="trips-next"]').click();
    await vibe.find('[data-testid="trips-prev"]').click();
    expect(await referencesOnPage()).toEqual(first);
    expect(await navDisabled("prev")).toBe(true);
  });

  it("E-26 filtering collapses the pages, and clearing it restores them", async () => {
    const before = await pageLabel();
    const filterEl = await vibe.find('[data-testid="trips-filter"]');
    await filterEl.click();
    await filterEl.type("Frankfurt");

    expect(await pageLabel()).toBe("Page 1 of 1");
    const filtered = await referencesOnPage();
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(13);

    await filterEl.clear();
    expect(await pageLabel()).toBe(before);
  });
});
