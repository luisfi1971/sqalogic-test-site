/**
 * SIBLING LISTS OF ONE NAME — a stable test-bed page for the class corpus 02
 * (DataTables' "Other examples" index) exposed on 2026-10-17: many link lists
 * that a reader names identically ("list") and that only what is AROUND each
 * one tells apart — the heading it sits under (section), a named navigation
 * (landmark), or a handled ancestor (anchor). Every list holds the same kind
 * of item, so nothing inside a list is decisive on its own.
 *
 * `?heading=renamed` rewords ONE section heading ("Bookings" → "Reservations"
 * and back), so a re-learn proves a reworded heading keeps its record through
 * the rest of what identifies the list — never a retire plus a new record.
 */
const GROUPS: Array<{ heading: string; links: Array<[string, string]> }> = [
  {
    heading: "Getting started",
    links: [
      ["/practice/sibling-lists#install", "Install"],
      ["/practice/sibling-lists#configure", "Configure"],
      ["/practice/sibling-lists#first-run", "First run"],
    ],
  },
  {
    heading: "Bookings",
    links: [
      ["/practice/sibling-lists#search", "Search"],
      ["/practice/sibling-lists#seats", "Seats"],
      ["/practice/sibling-lists#extras", "Extras"],
    ],
  },
  {
    heading: "Payments",
    links: [
      ["/practice/sibling-lists#cards", "Cards"],
      ["/practice/sibling-lists#refunds", "Refunds"],
      ["/practice/sibling-lists#invoices", "Invoices"],
    ],
  },
];

const PRIMARY: Array<[string, string]> = [
  ["/practice", "Practice"],
  ["/search", "Search"],
  ["/practice/table", "Table"],
];
const FOOTER: Array<[string, string]> = [
  ["/practice/todos", "Todos"],
  ["/practice/hobbies", "Hobbies"],
  ["/practice/location", "Location"],
];
const RELATED: Array<[string, string]> = [
  ["/practice/invoices", "Invoices"],
  ["/practice/wizard", "Wizard"],
  ["/practice/twins", "Twins"],
];

function LinkList({ links }: { links: Array<[string, string]> }) {
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {links.map(([href, text]) => (
        <li key={href}>
          <a href={href} className="text-[color:var(--brand-accent)] hover:underline">
            {text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The page body — `renamed` rewords the «Bookings» heading. */
export function SiblingLists({ renamed = false }: { renamed?: boolean }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Guides index</h1>
      <nav aria-label="Primary" className="mt-4">
        <LinkList links={PRIMARY} />
      </nav>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <h2 className="text-lg font-semibold">All guides</h2>
          {GROUPS.map((g) => (
            <div key={g.heading} className="mt-4">
              <h3 className="font-medium">
                {renamed && g.heading === "Bookings" ? "Reservations" : g.heading}
              </h3>
              <LinkList links={g.links} />
            </div>
          ))}
        </section>
        {/* An unlabelled sidebar: only its handled id tells its list apart. */}
        <aside id="related">
          <div className="card">
            <LinkList links={RELATED} />
          </div>
        </aside>
      </div>
      {/*
        THE PINNED CASE: this navigation comes AFTER the guides, whose last
        heading is «Payments». Nothing about «Payments» is this list's — it is
        named by its own landmark («Footer»), never by a heading nested in a
        neighbouring subtree.
      */}
      <nav aria-label="Footer" className="mt-8 border-t pt-4">
        <LinkList links={FOOTER} />
      </nav>
    </div>
  );
}

export default async function SiblingListsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <SiblingLists renamed={sp.heading === "renamed"} />;
}
