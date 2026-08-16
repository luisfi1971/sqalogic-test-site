import { cookies } from "next/headers";
import PassengerForm from "./PassengerForm";
import { VARIANT_COOKIE, parseVariant } from "../../lib/testControls";

/**
 * Server Component on purpose — same contract as /search: the breakage variant
 * is resolved per request (query string first, opt-in cookie second) and handed
 * to the client form as a prop, so it lands in the RSC flight payload as well
 * as the initial HTML.
 */
export default async function PassengerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const variant = parseVariant(sp.variant ?? cookieStore.get(VARIANT_COOKIE)?.value);

  return (
    <div className="max-w-3xl mx-auto" data-variant={variant}>
      <PassengerForm variant={variant} />
    </div>
  );
}
