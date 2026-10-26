/**
 * REGION TWINS — a stable test-bed page for two controls of the same class and
 * the IDENTICAL name that only the region of the page they sit in tells apart
 * (SQALOGIC TestHub, branch chrome-counts, 2026-10-25).
 *
 * The site header (Header.tsx, the page's banner) carries a «Practice» link to
 * /practice. This page's own content carries a second link that reads exactly
 * «Practice» — same role, same name, same case — and goes somewhere else: back
 * to this page with `?via=main`, where a result line says which one was
 * pressed. Nothing on either link tells them apart; the header's sits in the
 * banner's navigation, this one in main.
 *
 * Measured the day it was written, on «/»: the header's «Search Flights» and
 * the page's «Search flights» were two records of the map and one address of
 * the walk (job 8ab42f94), because the address said the class and the name and
 * dropped where the control sits. This page holds the same class with the case
 * difference removed, so a tool that tells the two apart by a letter's case is
 * caught too. A story that presses the page's own «Practice» must land here
 * with the result line, never on /practice.
 *
 * Deliberately NOT linked from the /practice index: an index entry is a new
 * record on a page the corpus re-learn bar reads. Stories open it by its path.
 */
export default async function RegionTwinsPage({
  searchParams,
}: {
  searchParams: Promise<{ via?: string }>;
}) {
  const { via } = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Two links, one name</h1>
      <p className="mt-2 text-sm text-gray-600">
        The header has a link that reads the same as the one below.
      </p>
      <p className="mt-4">
        <a href="/practice/region-twins?via=main" className="underline">
          Practice
        </a>
      </p>
      <p className="mt-4" data-testid="arrived">
        {via === "main" ? "You pressed the page's own Practice link." : "Nothing pressed yet."}
      </p>
    </div>
  );
}
