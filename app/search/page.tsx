import { cookies } from "next/headers";
import SearchForm from "./SearchForm";
import { VARIANT_COOKIE, parseVariant } from "../lib/testControls";

/**
 * Server Component on purpose.
 *
 * The breakage variant is resolved here, per request, and handed to the client
 * form as a prop. Because it is a prop of a Server Component, it lands in the
 * RSC flight payload as well as the initial HTML — so a client-side navigation
 * to /search?variant=… gets the mutated tree, not a stale one.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  // Query string outranks the cookie; the cookie only exists if someone asked
  // for it with &sticky=1.
  const variant = parseVariant(
    sp.variant ?? cookieStore.get(VARIANT_COOKIE)?.value
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]" data-variant={variant}>
      <SearchForm variant={variant} />

      <div className="card">
        <h2 className="text-sm font-semibold">Subscribe for deals</h2>
        <p className="mt-1 text-xs text-slate-500">
          This newsletter form lives inside an iframe — classic automation challenge.
        </p>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <iframe
            src="/embed/newsletter"
            title="Newsletter signup"
            name="sqa-newsletter"
            id="newsletter-frame"
            className="w-full"
            style={{ height: 380, border: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
