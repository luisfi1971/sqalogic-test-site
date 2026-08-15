import { cookies } from "next/headers";
import ExtrasClient from "./ExtrasClient";
import { VARIANT_COOKIE, parseVariant } from "../../lib/testControls";

/** Server Component — per-request variant resolution, same contract as /search. */
export default async function ExtrasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const variant = parseVariant(sp.variant ?? cookieStore.get(VARIANT_COOKIE)?.value);

  return (
    <div className="max-w-3xl mx-auto" data-variant={variant}>
      <ExtrasClient variant={variant} />
    </div>
  );
}
