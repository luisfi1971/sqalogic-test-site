/**
 * TWINS — a stable test-bed page for controls that nothing a person READS
 * tells apart (2026-10-17). The one deliberate exception to "every control has
 * a sane accessible name" on the practice pages:
 *
 *   - twin FIELDS: every row's Action cell holds two buttons that both read
 *     «Go»; only `data-op` (approve / reject) tells them apart;
 *   - twin LISTS: two lists of the same three links under no heading, in no
 *     named region; only `data-region` (north / south) tells them apart;
 *   - twins told apart only by their CONTAINMENT CHAIN (c1d412ad; owner
 *     2026-10-17: "impossible they are not distinguishable — parent, child
 *     items, something would differ"): every row of the `queue` table holds
 *     two «Go» buttons that carry nothing different THEMSELVES — the slot
 *     each sits in does (`data-slot`); every row of the `holds` table holds
 *     two identical «Go» buttons whose icon differs (`data-icon`, on the one
 *     element inside each that carries it).
 *
 * A tool must never merge them and never name them by position. The learn
 * offers what differs — on the control, around it, or inside it — the walk
 * asks a person which property tells them apart, the answer joins the
 * application's candidates, and every later learn keeps them apart with no
 * question.
 */
const REQUESTS = [
  { ref: "REQ-1041", who: "Amara Okafor" },
  { ref: "REQ-1042", who: "Bruno Tremblay" },
  { ref: "REQ-1043", who: "Chen Wei" },
  { ref: "REQ-1044", who: "Dana Moreau" },
];
const BRANCHES: Array<[string, string]> = [
  ["/practice/twins#hours", "Hours"],
  ["/practice/twins#staff", "Staff"],
  ["/practice/twins#contact", "Contact"],
];

export default function TwinsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pending requests</h1>
      <table className="mt-4 text-sm" data-testid="requests">
        <thead>
          <tr>
            <th className="pr-6 text-left">Reference</th>
            <th className="pr-6 text-left">Requester</th>
            <th className="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {REQUESTS.map((r) => (
            <tr key={r.ref}>
              <td className="pr-6">{r.ref}</td>
              <td className="pr-6">{r.who}</td>
              <td className="space-x-2">
                <button type="button" className="btn" data-op="approve">
                  Go
                </button>
                <button type="button" className="btn" data-op="reject">
                  Go
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* No heading: the page carries none (the lists below must sit under nothing). */}
      <table className="mt-8 text-sm" data-testid="queue">
        <thead>
          <tr>
            <th className="pr-6 text-left">Reference</th>
            <th className="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {REQUESTS.map((r) => (
            <tr key={r.ref}>
              <td className="pr-6">{r.ref}</td>
              <td className="space-x-2">
                <span data-slot="approve">
                  <button type="button" className="btn">
                    Go
                  </button>
                </span>
                <span data-slot="reject">
                  <button type="button" className="btn">
                    Go
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mt-8 text-sm" data-testid="holds">
        <thead>
          <tr>
            <th className="pr-6 text-left">Reference</th>
            <th className="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {REQUESTS.map((r) => (
            <tr key={r.ref}>
              <td className="pr-6">{r.ref}</td>
              <td className="space-x-2">
                <button type="button" className="btn">
                  <span aria-hidden="true" data-icon="keep" />
                  Go
                </button>
                <button type="button" className="btn">
                  <span aria-hidden="true" data-icon="release" />
                  Go
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <ul className="space-y-1 text-sm" data-region="north">
          {BRANCHES.map(([href, text]) => (
            <li key={href}>
              <a href={href}>{text}</a>
            </li>
          ))}
        </ul>
        <ul className="space-y-1 text-sm" data-region="south">
          {BRANCHES.map(([href, text]) => (
            <li key={href}>
              <a href={href}>{text}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
