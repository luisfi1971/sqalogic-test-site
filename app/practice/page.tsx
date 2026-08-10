import Link from "next/link";

const PAGES = [
  {
    href: "/practice/table",
    title: "Data table",
    blurb:
      "137 reservations with column sorting, a text filter, page-size control and pagination. The most common real-world automation target.",
  },
  {
    href: "/practice/wizard",
    title: "Multi-step wizard",
    blurb:
      "Four steps that carry state forward, free back-navigation, and a review screen that must show what you actually typed.",
  },
  {
    href: "/practice/upload",
    title: "File upload",
    blurb:
      "Attach a travel document. Wrong type or oversized files are rejected with a visible error — the failure path is the interesting one.",
  },
  {
    href: "/practice/autocomplete",
    title: "Autocomplete / typeahead",
    blurb:
      "Airport search with debounced async suggestions, arrow-key navigation, Enter to pick and Escape to dismiss.",
  },
  {
    href: "/practice/feed",
    title: "Infinite scroll",
    blurb:
      "200 deals loaded 20 at a time as you reach the bottom. Rows do not exist in the DOM until you scroll to them.",
  },
  {
    href: "/practice/iframe",
    title: "Form in an iframe",
    blurb:
      "A support ticket form in a same-origin iframe. Fill it inside the frame, then read the ticket reference in the parent page.",
  },
];

const VARIANT_LINKS: { variant: string; what: string }[] = [
  { variant: "none", what: "baseline — nothing is mutated" },
  { variant: "id-rotation", what: "ids and data-testid values gain a suffix" },
  { variant: "text-change", what: "submit reads “Find Flights”, heading reads “Flight search”" },
  { variant: "type-change", what: "submit flips between <button> and div[role=button]" },
  { variant: "moved-container", what: "the To field gains two ancestors" },
  { variant: "sibling-reorder", what: "From and To swap places" },
  { variant: "element-removed", what: "the submit control is gone" },
];

export const metadata = {
  title: "Practice pages · SQALOGIC Automation Test Site",
};

export default function PracticeIndex() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Practice pages</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Self-contained pages for automation patterns the booking flow does not cover.
        They behave like a normal app — no puzzles, no hidden traps. Every control has a
        sane role and accessible name, with one documented exception on the data table
        page.
      </p>

      <ul className="mt-6 grid gap-4 md:grid-cols-2" data-testid="practice-index">
        {PAGES.map((p) => (
          <li key={p.href} className="card">
            <h2 className="text-base font-semibold">
              <Link
                href={p.href}
                className="text-[color:var(--brand-accent)] hover:underline"
              >
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-slate-600">{p.blurb}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Breakage variants</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Named mutations of the search page, selected <strong>per request</strong> by the{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">variant</code> query
        parameter. Nothing is stored server-side, so two runs with different variants
        never see each other&apos;s. These are ordinary client-side links, which is also
        how you can check the variant survives a client-side navigation.
      </p>

      <ul className="mt-4 space-y-2 text-sm" data-testid="variant-links">
        {VARIANT_LINKS.map((v) => (
          <li key={v.variant}>
            <Link
              href={`/search?variant=${v.variant}`}
              className="font-mono text-[color:var(--brand-accent)] hover:underline"
              data-variant-link={v.variant}
            >
              /search?variant={v.variant}
            </Link>
            <span className="text-slate-500"> — {v.what}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-2xl text-xs text-slate-500">
        Add <code className="rounded bg-slate-100 px-1">&amp;sticky=1</code> to carry a
        variant across pages via a cookie, and{" "}
        <code className="rounded bg-slate-100 px-1">?delay=off</code> to switch off the
        injected jitter. Full reference in{" "}
        <code className="rounded bg-slate-100 px-1">docs/TEST-CONTROLS.md</code>.
      </p>
    </div>
  );
}
