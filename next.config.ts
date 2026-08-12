import type { NextConfig } from "next";

/**
 * `/rest/v1/*` is proxied to a PostgREST holding this site's own schema
 * (`supabase/migrations`, applied to a `testsite` database).
 *
 * Why route through this app's own origin instead of pointing the client
 * straight at PostgREST: supabase-js appends `/rest/v1` to its base URL, which
 * PostgREST does not serve, and a same-origin path avoids CORS entirely. The
 * rewrite is the adapter between those two shapes.
 *
 * `REST_UPSTREAM` is read from the environment so a deployment that has a real
 * Supabase behind it can leave this inert — the rewrite only matters where the
 * upstream is a local PostgREST.
 */
const REST_UPSTREAM = process.env.REST_UPSTREAM ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/rest/v1/:path*", destination: `${REST_UPSTREAM}/:path*` }];
  },
};

export default nextConfig;
