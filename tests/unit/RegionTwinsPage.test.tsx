/**
 * /practice/region-twins — the properties that make it the test bed it is
 * (2026-10-25). Two links of one role and the IDENTICAL name «Practice»: the
 * site header's, to /practice, and this page's own, back here with ?via=main.
 * Only the region each sits in tells them apart. An ordinary tidy-up — a
 * distinct label "for accessibility", a test id on one — would make the page
 * stop testing anything, so the properties are asserted here.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegionTwinsPage from "@app/practice/region-twins/page";

describe("/practice/region-twins — twins only the page region tells apart", () => {
  it("the page's own link reads exactly «Practice», carries nothing that tells it apart, and leads back here", async () => {
    render(await RegionTwinsPage({ searchParams: Promise.resolve({}) }));
    const links = Array.from(document.querySelectorAll("a")).filter(
      (a) => (a.textContent ?? "").trim() === "Practice",
    );
    expect(links).toHaveLength(1);
    const own = links[0] as HTMLAnchorElement;
    expect(own.getAttribute("href")).toBe("/practice/region-twins?via=main");
    expect(own.getAttributeNames().sort()).toEqual(["class", "href"]);
    expect(document.querySelector('[data-testid="arrived"]')?.textContent).toBe("Nothing pressed yet.");
  });

  it("the header's twin is the same word, same case", async () => {
    const { readFileSync } = await import("node:fs");
    const header = readFileSync("app/components/Header.tsx", "utf8");
    expect(header).toMatch(/<Link href="\/practice"[^>]*>Practice<\/Link>/);
  });

  it("pressed, the result line says which link was pressed", async () => {
    render(await RegionTwinsPage({ searchParams: Promise.resolve({ via: "main" }) }));
    expect(document.querySelector('[data-testid="arrived"]')?.textContent).toBe(
      "You pressed the page's own Practice link.",
    );
  });
});
