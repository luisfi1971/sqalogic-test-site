import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("API: supabase client edge behavior", () => {
  it("A-17 missing env still constructs client (fallback), real call fails", { timeout: 15000 }, async () => {
    const client = createClient("http://127.0.0.1:1", "anon", { auth: { persistSession: false } });
    const { error } = await client.from("users").select("id").limit(1);
    expect(error).not.toBeNull();
  });

  it("A-18 bogus URL produces a network error, not unhandled rejection", { timeout: 15000 }, async () => {
    const client = createClient("https://invalid-host-sqatest.invalid", "anon", {
      auth: { persistSession: false },
    });
    const { error } = await client.from("users").select("id").limit(1);
    expect(error).not.toBeNull();
  });
});
