/**
 * The archetype's PROPERTIES, pinned.
 *
 * `/practice/invoices` exists to be a target for automation tooling, and it is
 * only that target while three things stay true. All three are the kind of
 * thing an ordinary tidy-up would break without anyone noticing: give the
 * buttons distinct labels "for accessibility", add a `data-testid` to the
 * reminder buttons "for consistency", or drop one down to nine rows.
 *
 * So they are asserted here rather than described in a comment.
 */
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import InvoicesPage from "@app/practice/invoices/page";

const textsOf = (nodes: ArrayLike<Element>) =>
  Array.from(nodes, (n) => (n.textContent ?? "").trim());

describe("/practice/invoices — marked row actions", () => {
  it("every invoice action reads the same word, and the marks are what differ", () => {
    render(<InvoicesPage />);
    const actions = document.querySelectorAll('[data-testid="invoice-register"] tbody button');
    expect(actions.length).toBe(12);
    // IDENTICAL TEXT. This is the property the archetype exists for: an
    // automation tool cannot address one of these by what a person reads.
    expect(new Set(textsOf(actions))).toEqual(new Set(["View"]));
    // DISTINCT MARKS, sharing one convention, so a template plus a key is an
    // address.
    const marks = Array.from(actions, (a) => a.getAttribute("data-testid"));
    expect(marks.every((m) => m?.startsWith("invoice-view-INV-"))).toBe(true);
    expect(new Set(marks).size).toBe(12);
  });

  it("the reminder action is keyed by a data-* attribute that is NOT data-testid", () => {
    render(<InvoicesPage />);
    const actions = document.querySelectorAll('[data-testid="reminder-list"] li button');
    expect(actions.length).toBe(11);
    expect(new Set(textsOf(actions))).toEqual(new Set(["Remind"]));

    const marks = Array.from(actions, (a) => a.getAttribute("data-invoice-id"));
    expect(new Set(marks).size).toBe(11);
    expect(marks.every((m) => m?.startsWith("INV-3"))).toBe(true);
    // The point of this list. A tool that only reads `data-testid` finds
    // nothing here, and most applications look like this one.
    expect(Array.from(actions).every((a) => a.getAttribute("data-testid") === null)).toBe(true);
  });

  it("the unallocated receipts carry NO mark at all — the honest negative", () => {
    render(<InvoicesPage />);
    const actions = document.querySelectorAll('[data-testid="unallocated-receipts"] button');
    expect(actions.length).toBe(10);
    expect(new Set(textsOf(actions))).toEqual(new Set(["Match"]));
    for (const a of Array.from(actions)) {
      const named = a.getAttributeNames().filter((n) => n === "id" || n.startsWith("data-"));
      expect(named).toEqual([]);
    }
  });

  it("the unallocated receipts differ by date and amount, but NOT by payer", () => {
    // Measured off the rendered page, and pinned because an automation tool
    // downstream asserts exactly this: the parts of the row that vary stay
    // addressable by what they show, and the payer name is not one of them —
    // ten receipts carry four distinct names, because repeat payers are
    // exactly who forgets to quote an invoice number. A person's name
    // identifies nobody, which is why applications mark rows at all.
    render(<InvoicesPage />);
    const rows = Array.from(
      document.querySelectorAll('[data-testid="unallocated-receipts"] > div'),
    );
    const payers = rows.map((r) => r.querySelector(".font-semibold")?.textContent ?? "");
    const amounts = rows.map((r) => r.querySelector(".text-lg")?.textContent ?? "");
    expect(new Set(amounts).size).toBe(rows.length);
    expect(new Set(payers).size).toBeLessThan(rows.length);
  });

  it("each list is long enough to be a real list, not a sample of one", () => {
    render(<InvoicesPage />);
    expect(
      document.querySelectorAll('[data-testid="invoice-register"] tbody tr').length,
    ).toBeGreaterThanOrEqual(10);
    expect(document.querySelectorAll('[data-testid="reminder-list"] li').length).toBeGreaterThanOrEqual(10);
    expect(
      document.querySelectorAll('[data-testid="unallocated-receipts"] > div').length,
    ).toBeGreaterThanOrEqual(10);
  });

  it("the actions actually do something — a dead button is not a target", () => {
    // A control nothing observes is not exercisable, and an archetype whose
    // buttons do nothing cannot tell a tool that clicked the RIGHT one from a
    // tool that clicked the first.
    const user = userEvent.setup();
    render(<InvoicesPage />);
    const readout = document.querySelector('[data-testid="ar-last-action"]') as Element;
    expect(readout.textContent).toContain("No action taken yet");

    return (async () => {
      const third = document.querySelectorAll(
        '[data-testid="reminder-list"] li button',
      )[2] as Element;
      const ref = third.getAttribute("data-invoice-id");
      await user.click(third);
      expect(readout.textContent).toContain("Remind");
      expect(readout.textContent).toContain(ref as string);
    })();
  });
});
