import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Warn once at module load; pages still render but DB calls will throw.
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * The data base URL FOLLOWS THE PAGE. It is not baked at build time.
 *
 * Two defects made this necessary, and both cost real measurement time:
 *
 *  1. `url || "http://localhost"` — a silent fallback. With the env unset at
 *     build time the app addressed a backend that had never run on the machine,
 *     served 200, and rendered its empty state forever. "No data" and "no
 *     backend" were indistinguishable, and every data-backed test measured an
 *     empty app without anyone noticing.
 *
 *  2. Baking an absolute origin breaks the moment the page is reached by any
 *     other name. Built with the LAN address and browsed at `localhost`, every
 *     data call becomes cross-origin and CORS-blocked — login silently fails
 *     and the whole app reads as logged-out. Which host reaches an app is not
 *     a build-time fact.
 *
 * In the browser, same-origin is always right: `/rest/v1/*` is rewritten to
 * PostgREST by next.config.ts. On the server there is no `window`, and the env
 * value is the honest answer — absent, we fail loudly rather than invent one.
 */
const baseUrl =
  typeof window !== "undefined" ? window.location.origin : (url ?? "");

if (!baseUrl) {
  throw new Error(
    "[supabase] no base URL — set NEXT_PUBLIC_SUPABASE_URL for server-side rendering",
  );
}

export const supabase = createClient(baseUrl, key || "anon", {
  auth: { persistSession: false },
});

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
};

export type DbBooking = {
  id: string;
  user_email: string | null;
  flight_id: string;
  from_airport: string;
  to_airport: string;
  date: string;
  passenger: string;
  price: number;
  created_at: string;
};
