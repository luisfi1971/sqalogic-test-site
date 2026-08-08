import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { launch, BASE_URL, DEMO, MARIE } from "./_helpers.mts";

// Two things the matrix wants, which happen to sit together:
//
//  - Personas give the shared-dataset target: the same flows over different
//    data, so a suite that quietly depends on one account's rows fails instead
//    of passing by luck.
//  - The FR-CA toggle lets Gherkin's `# language: fr` be demonstrated live
//    rather than promised, which is the Bill 96 angle in the Quebec market.

let bro: Awaited<ReturnType<typeof launch>>["bro"];
let vibe: Awaited<ReturnType<typeof launch>>["vibe"];

const TABLE = '[data-testid="trips-table"]';

async function signIn(who: { email: string; password: string }, query = "") {
  await vibe.go(`${BASE_URL}/login${query}`);
  const emailEl = await vibe.find('input[type="email"]');
  await emailEl.click();
  await emailEl.type(who.email);
  const pwEl = await vibe.find('input[type="password"]');
  await pwEl.click();
  await pwEl.type(who.password);
  await vibe.find({ role: "button", text: "Sign in" }).click();
  await vibe.waitUntil.url(`${BASE_URL}/search`);
}

async function references(): Promise<string[]> {
  return (await vibe.evaluate(`
    Array.from(document.querySelectorAll('${TABLE} tbody tr td[data-col="reference"]'))
      .map(td => td.textContent.trim())
  `)) as string[];
}

/**
 * Wait on the *state*, not on the element. The locale is applied in an effect
 * after mount, so the toggle exists for a moment while the page is still
 * English — waiting for the element alone reads that flash.
 */
async function waitForLocale(code: "en" | "fr-CA") {
  await vibe.find(`[data-testid="locale-toggle"][data-locale="${code}"]`).waitUntil("visible");
}

async function headerText(): Promise<string> {
  return (await vibe.evaluate(`document.querySelector('header').textContent`)) as string;
}

beforeAll(async () => {
  ({ bro, vibe } = await launch());
});

afterAll(async () => {
  await bro?.stop();
});

describe("E2E: personas", () => {
  it("E-46 Marie sees her own trips, not the demo account's", async () => {
    await signIn(MARIE);
    await vibe.go(`${BASE_URL}/my-trips`);
    await vibe.find(TABLE).waitUntil("visible");

    const refs = await references();
    expect(refs).toEqual(expect.arrayContaining(["BK-MARIE1", "BK-MARIE2", "BK-MARIE3"]));
    // The assertion that makes the persona worth having: a suite hardcoded to
    // the demo account's rows fails here rather than passing by accident.
    expect(refs.some((r) => r.startsWith("BK-DEMO"))).toBe(false);
  });

  it("E-47 her dataset is a different shape — one row arrives already cancelled", async () => {
    await signIn(MARIE);
    await vibe.go(`${BASE_URL}/my-trips`);
    await vibe.find(TABLE).waitUntil("visible");

    const state = (await vibe.evaluate(`
      (() => {
        const row = Array.from(document.querySelectorAll('${TABLE} tbody tr'))
          .find(r => r.querySelector('td[data-col="reference"]').textContent.trim() === 'BK-MARIE3');
        return [
          row.querySelector('td[data-col="status"]').textContent.trim(),
          row.querySelector('[data-testid="trip-select"]').disabled,
          row.querySelector('[data-testid="trip-cancel"]').disabled
        ];
      })()
    `)) as [string, boolean, boolean];

    expect(state).toEqual(["Cancelled", true, true]);
  });

  it("E-48 one page, because she has fewer trips than the demo account", async () => {
    await signIn(MARIE);
    await vibe.go(`${BASE_URL}/my-trips`);
    await vibe.find(TABLE).waitUntil("visible");
    const nextDisabled = (await vibe.evaluate(
      `document.querySelector('[data-testid="trips-next"]').disabled`
    )) as boolean;
    expect(nextDisabled).toBe(true);
  });
});

describe("E2E: FR-CA locale", () => {
  it("E-49 ?lang=fr renders the site in French and stamps the html lang", async () => {
    await vibe.go(`${BASE_URL}/search?lang=fr`);
    await waitForLocale("fr-CA");

    expect(await headerText()).toContain("Mes voyages");
    const lang = (await vibe.evaluate(`document.documentElement.lang`)) as string;
    expect(lang).toBe("fr-CA");
  });

  it("E-50 the automation surface is identical in both languages", async () => {
    // This is what makes a bilingual demo runnable instead of a second suite to
    // maintain: the hooks do not translate.
    await signIn(DEMO, "?lang=fr");
    await vibe.go(`${BASE_URL}/my-trips`);
    await vibe.find(TABLE).waitUntil("visible");
    await waitForLocale("fr-CA");

    const probe = (await vibe.evaluate(`
      [document.querySelectorAll('[data-testid="trip-select"]').length,
       document.querySelectorAll('[data-col="reference"]').length,
       document.querySelector('[data-testid="trips-cancel-selected"]').textContent.trim()]
    `)) as [number, number, string];

    expect(probe[0]).toBe(5);
    expect(probe[1]).toBe(5);
    expect(probe[2]).toBe("Annuler la sélection");
  });

  it("E-51 the toggle switches back, and the choice survives a hop", async () => {
    await vibe.go(`${BASE_URL}/search?lang=fr`);
    await waitForLocale("fr-CA");
    expect(await headerText()).toContain("Mes voyages");

    // No ?lang= on this URL — the session carries it.
    await vibe.go(`${BASE_URL}/my-trips`);
    await waitForLocale("fr-CA");
    expect(await headerText()).toContain("Mes voyages");

    await vibe.find('[data-testid="locale-toggle"]').click();
    await waitForLocale("en");
    expect(await headerText()).toContain("My Trips");
    const lang = (await vibe.evaluate(`document.documentElement.lang`)) as string;
    expect(lang).toBe("en");
  });

  it("E-52 ?lang=en overrides a remembered French", async () => {
    await vibe.go(`${BASE_URL}/search?lang=fr`);
    await waitForLocale("fr-CA");
    await vibe.go(`${BASE_URL}/search?lang=en`);
    await waitForLocale("en");
    expect(await headerText()).toContain("My Trips");
  });
});
