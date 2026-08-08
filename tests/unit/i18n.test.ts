import { describe, it, expect } from "vitest";
import { LOCALES, MESSAGES, resolveLocale, translate } from "@app/lib/i18n";

describe("locale resolution", () => {
  it("U-60 defaults to English", () => {
    expect(resolveLocale("", null)).toBe("en");
    expect(resolveLocale("?from=YUL", null)).toBe("en");
  });

  it("U-60a ?lang=fr and ?lang=fr-CA both mean French", () => {
    expect(resolveLocale("?lang=fr", null)).toBe("fr-CA");
    expect(resolveLocale("?lang=fr-CA", null)).toBe("fr-CA");
    expect(resolveLocale("?lang=FR-ca", null)).toBe("fr-CA");
  });

  it("U-60b the session carries the choice across client-side hops", () => {
    expect(resolveLocale("", "fr-CA")).toBe("fr-CA");
    expect(resolveLocale("?from=YUL&to=JFK", "fr-CA")).toBe("fr-CA");
  });

  it("U-60c an explicit param beats the remembered value, both ways", () => {
    expect(resolveLocale("?lang=en", "fr-CA")).toBe("en");
    expect(resolveLocale("?lang=fr", "en")).toBe("fr-CA");
  });

  it("U-60d an unknown language falls back rather than breaking", () => {
    expect(resolveLocale("?lang=klingon", null)).toBe("en");
    expect(resolveLocale("?lang=klingon", "fr-CA")).toBe("fr-CA");
  });
});

describe("translation", () => {
  it("U-61 returns the locale's string", () => {
    expect(translate("en", "trips.title")).toBe("My trips");
    expect(translate("fr-CA", "trips.title")).toBe("Mes voyages");
  });

  it("U-61a interpolates named variables", () => {
    expect(translate("en", "trips.selected", { count: 3 })).toBe("3 selected");
    expect(translate("fr-CA", "trips.selected", { count: 3 })).toBe("3 sélectionnés");
    expect(translate("fr-CA", "trips.page", { page: 2, total: 3 })).toBe("Page 2 sur 3");
  });

  it("U-61b leaves a placeholder alone when no value is supplied", () => {
    // Better a visible {name} than the word "undefined" in the UI.
    expect(translate("en", "nav.greeting")).toBe("Hi, {name}");
    expect(translate("en", "nav.greeting", { other: "x" })).toBe("Hi, {name}");
  });

  it("U-62 English is unchanged from before i18n existed", () => {
    // Every existing suite matches on these, so drift here breaks them all.
    expect(translate("en", "trips.view")).toBe("View");
    expect(translate("en", "trips.cancel")).toBe("Cancel");
    expect(translate("en", "search.submit")).toBe("Search flights");
    expect(translate("en", "results.select")).toBe("Select");
    expect(translate("en", "nav.login")).toBe("Login");
    expect(translate("en", "logout.confirm")).toBe("Sign out of SQALOGIC Air?");
  });

  it("U-63 both locales define exactly the same keys", () => {
    // A missing French key would silently show English and look like a bug in
    // the toggle rather than a gap in the dictionary.
    const en = Object.keys(MESSAGES.en).sort();
    const fr = Object.keys(MESSAGES["fr-CA"]).sort();
    expect(fr).toEqual(en);
  });

  it("U-63a no French string was left identical to its English source", () => {
    // Catches keys copied across and never translated. A handful are genuinely
    // identical words in both languages, so those are named rather than
    // blanket-allowed.
    const SAME_IN_BOTH = new Set(["trips.date", "trips.actions"]);
    const untranslated = (Object.keys(MESSAGES.en) as Array<keyof typeof MESSAGES.en>)
      .filter((k) => !SAME_IN_BOTH.has(k))
      .filter((k) => MESSAGES.en[k] === MESSAGES["fr-CA"][k]);
    expect(untranslated).toEqual([]);
  });

  it("U-64 an unknown locale degrades to English rather than showing raw keys", () => {
    // @ts-expect-error deliberately passing a locale that is not in the union
    expect(translate("de", "trips.title")).toBe("My trips");
  });

  it("U-64a the exported locale list matches the dictionary", () => {
    expect(LOCALES.sort()).toEqual(Object.keys(MESSAGES).sort());
  });
});
