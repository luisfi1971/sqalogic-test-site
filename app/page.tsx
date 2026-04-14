import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-8 md:grid-cols-2 items-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Book your next flight with <span className="text-[color:var(--brand-accent)]">SQALOGIC Air</span>
        </h1>
        <p className="mt-4 text-slate-600">
          This is a practice playground for web automation tools. Search flights, register
          an account, book a trip, and then hit <em>Simulate New Release</em> to break the
          automation on purpose. See how well your tool self-heals.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/search" className="btn-primary">Search flights</Link>
          <Link href="/register" className="btn-ghost">Create account</Link>
        </div>
        <ul className="mt-8 space-y-2 text-sm text-slate-600">
          <li>&bull; User registration &amp; login</li>
          <li>&bull; Flight search, booking and payment simulation</li>
          <li>&bull; Intentionally tricky selectors (shifting IDs, nested DOM, missing labels)</li>
          <li>&bull; &quot;Simulate New Release&quot; button to rotate IDs and classes</li>
        </ul>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold">Why this site?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Most sample apps are too stable. This one changes under your feet so you can
          benchmark the self-healing of Testim, Mabl, Functionize, Tricentis, Katalon,
          Playwright + AI plug-ins, and any other framework your team is evaluating.
        </p>
        <div className="mt-4 rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <strong>Tip:</strong> Record a test, then click the amber
          <em> Simulate New Release</em> button in the header and re-run it.
        </div>
      </div>
    </div>
  );
}
