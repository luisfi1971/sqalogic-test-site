/**
 * The two collection-identity archetypes' PROPERTIES, pinned (2026-10-17).
 *
 * `/practice/sibling-lists` and `/practice/twins` exist as targets for the
 * object map's identity rules, and they stay that target only while the
 * properties below hold. An ordinary tidy-up breaks them silently — a heading
 * added above the navigations, distinct labels on the twin buttons "for
 * accessibility", a data-testid on one list — so they are asserted here.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiblingLists } from "@app/practice/sibling-lists/page";
import TwinsPage from "@app/practice/twins/page";

const textsOf = (nodes: ArrayLike<Element>) =>
  Array.from(nodes, (n) => (n.textContent ?? "").trim());

describe("/practice/sibling-lists — lists told apart by where they are", () => {
  it("six link lists of one kind: three under headings, two in named navigations, one in a handled sidebar", () => {
    render(<SiblingLists />);
    const lists = document.querySelectorAll("ul");
    expect(lists.length).toBe(6);
    for (const ul of Array.from(lists)) {
      expect(ul.querySelectorAll(":scope > li > a").length).toBe(3);
      // Nothing on a list itself tells it apart.
      expect(ul.getAttributeNames().filter((a) => a !== "class")).toEqual([]);
    }
    expect(
      Array.from(document.querySelectorAll("nav"), (n) => n.getAttribute("aria-label")),
    ).toEqual(["Primary", "Secondary"]);
    expect(document.querySelectorAll("#related ul").length).toBe(1);
    expect(textsOf(document.querySelectorAll("h3"))).toEqual([
      "Getting started",
      "Bookings",
      "Payments",
    ]);
    // No heading precedes the navigations or the sidebar: a heading must not be what names them.
    const first = document.querySelector("h1, h2, h3");
    const nav = document.querySelector("nav");
    expect(first && nav && first.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("?heading=renamed rewords exactly one heading", () => {
    render(<SiblingLists renamed />);
    expect(textsOf(document.querySelectorAll("h3"))).toEqual([
      "Getting started",
      "Reservations",
      "Payments",
    ]);
  });
});

describe("/practice/twins — only an attribute tells them apart", () => {
  it("every row's two action buttons read the same word and differ only by data-op", () => {
    render(<TwinsPage />);
    const rows = document.querySelectorAll('[data-testid="requests"] tbody tr');
    expect(rows.length).toBe(4);
    for (const row of Array.from(rows)) {
      const buttons = row.querySelectorAll("button");
      expect(textsOf(buttons)).toEqual(["Go", "Go"]);
      expect(Array.from(buttons, (b) => b.getAttribute("data-op"))).toEqual(["approve", "reject"]);
      expect(Array.from(buttons, (b) => b.getAttribute("aria-label"))).toEqual([null, null]);
    }
  });

  it("two lists show the same links and differ only by data-region", () => {
    render(<TwinsPage />);
    const lists = document.querySelectorAll("ul[data-region]");
    expect(Array.from(lists, (l) => l.getAttribute("data-region"))).toEqual(["north", "south"]);
    expect(textsOf(lists[0]?.querySelectorAll("a") ?? [])).toEqual(
      textsOf(lists[1]?.querySelectorAll("a") ?? []),
    );
    expect(document.querySelectorAll("h2, h3").length).toBe(0);
  });
});
