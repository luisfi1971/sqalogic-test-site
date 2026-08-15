import { cookies } from "next/headers";
import SeatsClient from "./SeatsClient";
import { VARIANT_COOKIE, parseVariant } from "../../lib/testControls";

/** Server Component — per-request variant resolution, same contract as /search. */
export default async function SeatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const variant = parseVariant(sp.variant ?? cookieStore.get(VARIANT_COOKIE)?.value);

  return (
    <div className="max-w-3xl mx-auto" data-variant={variant}>
      <SeatsClient variant={variant} />
    </div>
  );
}
