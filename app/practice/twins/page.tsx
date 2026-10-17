/**
 * TWINS — a stable test-bed page for controls that nothing a person READS
 * tells apart (2026-10-17). The one deliberate exception to "every control has
 * a sane accessible name" on the practice pages:
 *
 *   - twin FIELDS: every row's Action cell holds two buttons that both read
 *     «Go»; only `data-op` (approve / reject) tells them apart;
 *   - twin LISTS: two lists of the same three links under no heading, in no
 *     named region; only `data-region` (north / south) tells them apart.
 *
 * A tool must never merge them and never name them by position: it asks which
 * property tells them apart, and once told, keeps them apart for good.
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
