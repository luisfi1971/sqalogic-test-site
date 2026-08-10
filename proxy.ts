import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DELAY_COOKIE,
  VARIANT_COOKIE,
  parseDelay,
  parseVariant,
} from "./app/lib/testControls";

/**
 * Opt-in stickiness for the per-request test controls.
 *
 * Does nothing at all unless the URL carries `sticky=1` together with
 * `variant=` and/or `delay=`. In that case the resolved value is mirrored into
 * a cookie so it survives navigations that drop the query string (for example
 * clicking a header link mid-journey).
 *
 * `?variant=none&sticky=1` / `?delay=default&sticky=1` clear the cookies again.
 *
 * Deliberately NOT global state: the cookie lives in the browser profile, so
 * two concurrent runs in two browser contexts cannot see each other's value,
 * and a query parameter always outranks the cookie on the request that carries
 * it. Without `sticky=1` this file is a no-op and leaves no residue.
 */
export function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  if (searchParams.get("sticky") !== "1") return NextResponse.next();

  const response = NextResponse.next();
  const cookieOptions = { path: "/", sameSite: "lax" as const };

  if (searchParams.has("variant")) {
    const variant = parseVariant(searchParams.get("variant"));
    if (variant === "none") response.cookies.delete(VARIANT_COOKIE);
    else response.cookies.set(VARIANT_COOKIE, variant, cookieOptions);
  }

  if (searchParams.has("delay")) {
    const raw = searchParams.get("delay") ?? "";
    const delay = parseDelay(raw);
    if (!delay) response.cookies.delete(DELAY_COOKIE);
    else response.cookies.set(DELAY_COOKIE, raw.trim().toLowerCase(), cookieOptions);
  }

  return response;
}

export const config = {
  // Page routes only — never static assets, images or API routes.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|txt)$).*)"],
};
