/**
 * MOVING SEGMENT — a stable test-bed page for ONE control whose name and
 * address carry a segment that moves between visits while everything else
 * holds still (SQALOGIC TestHub, branch id-param, 2026-10-30).
 *
 * The two links below read their full address as their name, as a library's
 * download links do. The middle segment is the release the page is set to
 * (`?release=`), so learning the page at `?release=r7` and again at
 * `?release=r8` gives two readings of the SAME two controls that differ in
 * that one segment only. The product must keep each link as ONE record with a
 * named parameter observed with both values — never two records, never a
 * changed name that loses the first value — and a check that names a release
 * must compare it exactly.
 *
 * The values are opaque tokens on purpose: nothing about their shape (a
 * version, a number, a date) may be what tells the tool which part moves.
 *
 * Deliberately NOT linked from the /practice index: an index entry is a new
 * record on a page the corpus re-learn bar reads. Stories open it by its path.
 */
export default async function MovingSegmentPage({
  searchParams,
}: {
  searchParams: Promise<{ release?: string }>;
}) {
  const { release } = await searchParams;
  const r = release && /^[A-Za-z0-9._-]{1,32}$/.test(release) ? release : "r7";
  const base = `https://assets.practice.invalid/${r}`;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Downloads</h1>
      <p className="mt-2 text-sm text-gray-600" data-testid="release">
        Release {r}
      </p>
      <ul className="mt-4 list-disc pl-6">
        <li>
          <a href={`${base}/js/widget.min.js`} className="underline">
            {`${base}/js/widget.min.js`}
          </a>
        </li>
        <li>
          <a href={`${base}/css/widget.min.css`} className="underline">
            {`${base}/css/widget.min.css`}
          </a>
        </li>
      </ul>
      <p className="mt-4">
        <a href={`/practice/moving-segment?release=${r === "r7" ? "r8" : "r7"}`} className="underline">
          Switch release
        </a>
      </p>
    </div>
  );
}
