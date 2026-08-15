import { cookies } from "next/headers";
import ConfirmationClient from "./ConfirmationClient";
import { VARIANT_COOKIE, parseVariant } from "../lib/testControls";

/**
 * Server Component — per-request variant resolution, same contract as /search.
 * A request with no ?variant= (and no opt-in cookie) renders exactly what this
 * page always has.
 */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const variant = parseVariant(sp.variant ?? cookieStore.get(VARIANT_COOKIE)?.value);

  return (
    <div data-variant={variant}>
      <ConfirmationClient variant={variant} />
    </div>
  );
}
