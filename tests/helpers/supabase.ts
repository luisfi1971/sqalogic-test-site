import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.test") });
config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) throw new Error("Missing Supabase env vars in .env.local");

export const sb = createClient(url, key, { auth: { persistSession: false } });

export const TEST_PREFIX = "test_";
export const testEmail = (tag: string) => `${TEST_PREFIX}${tag}_${Date.now()}@sqatest.local`;
export const testBookingId = (tag: string) => `${TEST_PREFIX}${tag}_${Date.now()}`;

export async function cleanupTestData() {
  await sb.from("bookings").delete().like("id", `${TEST_PREFIX}%`);
  await sb.from("users").delete().like("email", `${TEST_PREFIX}%`);
}
