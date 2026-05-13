import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sb, testEmail, cleanupTestData, TEST_PREFIX } from "../helpers/supabase";

describe("API: users table (Supabase real)", () => {
  beforeAll(cleanupTestData);
  afterAll(cleanupTestData);

  it("A-01 inserts valid user", async () => {
    const email = testEmail("a01");
    const { data, error } = await sb
      .from("users")
      .insert({ name: "A01", email, password: "hash" })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    expect(data?.email).toBe(email);
  });

  it("A-02 duplicate email rejected with unique violation (23505)", async () => {
    const email = testEmail("a02");
    await sb.from("users").insert({ name: "A02a", email, password: "h" });
    const { error } = await sb
      .from("users")
      .insert({ name: "A02b", email, password: "h" });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("A-03 missing email rejected (NOT NULL)", async () => {
    const { error } = await sb
      .from("users")
      // @ts-expect-error intentional null
      .insert({ name: "A03", email: null, password: "h" });
    expect(error).not.toBeNull();
    expect(error?.code).toMatch(/23502|23514/);
  });

  it("A-04 SELECT by unknown email returns empty array, not error", async () => {
    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("email", `${TEST_PREFIX}nope@sqatest.local`);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("A-05 stores password field as provided (hash expected by UI)", async () => {
    const email = testEmail("a05");
    const hash = "d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791";
    await sb.from("users").insert({ name: "A05", email, password: hash });
    const { data } = await sb.from("users").select("password").eq("email", email).single();
    expect(data?.password).toBe(hash);
    expect(data?.password).not.toBe("demo123");
  });
});
