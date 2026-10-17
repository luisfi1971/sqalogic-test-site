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
const SECONDARY: Array<[string, string]> = [
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
      {/*
        The two navigations and the sidebar come FIRST, with no heading before
        them: what tells them apart is their landmark name (Primary, Secondary)
        and the handled ancestor (#related) — never a heading.
      */}
      <div className="flex flex-wrap gap-8 border-b pb-4">
        <nav aria-label="Primary">
          <LinkList links={PRIMARY} />
        </nav>
        <nav aria-label="Secondary">
          <LinkList links={SECONDARY} />
        </nav>
        <div id="related">
          <div className="card">
            <LinkList links={RELATED} />
          </div>
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Guides index</h1>
      <section>
        {GROUPS.map((g) => (
          <div key={g.heading} className="mt-4">
            <h3 className="font-medium">
              {renamed && g.heading === "Bookings" ? "Reservations" : g.heading}
            </h3>
            <LinkList links={g.links} />
          </div>
        ))}
      </section>
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
