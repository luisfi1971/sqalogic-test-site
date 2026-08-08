import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { launch, BASE_URL } from "./_helpers.mts";

// The target for the canon's `drag`, which had none — and it is an interaction
// the TestHub itself uses in the suite tree.
//
// The list is driven by mouse events rather than the HTML5 drag-and-drop API.
// HTML5 DnD needs a real DataTransfer that synthetic events cannot supply, so a
// native-DnD list would be a target most engines can only fail — which measures
// the browser's API, not the engine.

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

async function order(): Promise<string[]> {
  return (await vibe.evaluate(
    `Array.from(document.querySelectorAll('[data-fav-airport]')).map(li => li.getAttribute('data-fav-airport'))`
  )) as string[];
}

beforeAll(async () => {
  ({ bro, vibe } = await launch());
});

afterAll(async () => {
  await bro?.stop();
});

beforeEach(async () => {
  await vibe.go(`${BASE_URL}/search`);
  await vibe.find('[data-testid="favourites-list"]').waitUntil("visible");
  await vibe.find('[data-testid="favourites-reset"]').click();
});

describe("E2E: drag to reorder favourite airports", () => {
  it("E-41 starts in the seeded order", async () => {
    expect(await order()).toEqual([
      "YUL - Montreal",
      "YYZ - Toronto",
      "JFK - New York",
      "LHR - London",
      "CDG - Paris",
    ]);
  });

  it("E-42 dragging the first row onto the third reorders the list", async () => {
    const before = await order();

    const source = await vibe.find('[data-fav-airport="YUL - Montreal"]');
    const target = await vibe.find('[data-fav-airport="JFK - New York"]');
    await source.dragTo(target);

    const after = await order();
    expect(after).not.toEqual(before);
    // The dragged row landed where it was dropped...
    expect(after.indexOf("YUL - Montreal")).toBe(2);
    // ...and nothing was lost or duplicated on the way.
    expect([...after].sort()).toEqual([...before].sort());
  });

  it("E-43 dragging upwards works too, not only down the list", async () => {
    const source = await vibe.find('[data-fav-airport="CDG - Paris"]');
    const target = await vibe.find('[data-fav-airport="YYZ - Toronto"]');
    await source.dragTo(target);

    const after = await order();
    expect(after.indexOf("CDG - Paris")).toBeLessThan(after.indexOf("LHR - London"));
    expect(after).toHaveLength(5);
    expect(new Set(after).size).toBe(5);
  });

  it("E-44 the new order survives a reload", async () => {
    const source = await vibe.find('[data-fav-airport="YUL - Montreal"]');
    const target = await vibe.find('[data-fav-airport="LHR - London"]');
    await source.dragTo(target);
    const afterDrag = await order();

    await vibe.go(`${BASE_URL}/search`);
    await vibe.find('[data-testid="favourites-list"]').waitUntil("visible");

    // A drop that only lives in React state cannot be verified after a reload,
    // so the order is persisted and this is the assertion that proves it.
    expect(await order()).toEqual(afterDrag);
  });

  it("E-45 Reset puts the seeded order back", async () => {
    const source = await vibe.find('[data-fav-airport="YUL - Montreal"]');
    const target = await vibe.find('[data-fav-airport="CDG - Paris"]');
    await source.dragTo(target);
    expect((await order())[0]).not.toBe("YUL - Montreal");

    await vibe.find('[data-testid="favourites-reset"]').click();
    expect((await order())[0]).toBe("YUL - Montreal");
  });
});
