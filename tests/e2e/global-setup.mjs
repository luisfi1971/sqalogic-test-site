import path from "node:path";

export const BASE_URL = process.env.E2E_BASE_URL || "https://sqalogic-test-site.vercel.app";

export async function setup() {
  // Reset release_state to 1 so tests hit the baseline UI (no dynamic DOM flips).
  const { config } = await import("dotenv");
  config({ path: path.join(process.cwd(), ".env.test") });
  config({ path: path.join(process.cwd(), ".env.local") });
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  await sb
    .from("release_state")
    .update({ release: 1, updated_at: new Date().toISOString() })
    .eq("id", 1);
}

export async function teardown() {
  // Nothing to teardown — testing deployed site.
}
