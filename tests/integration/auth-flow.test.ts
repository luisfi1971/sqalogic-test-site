import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sb, testEmail, cleanupTestData } from "../helpers/supabase";
import { sha256 } from "../../app/lib/hash";

// Mirrors AppProviders.register + login logic from app/providers.tsx
async function register(name: string, email: string, password: string) {
  if (!name || !email || !password) return { ok: false, error: "All fields are required" };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters" };
  const emailLc = email.toLowerCase();
  const { data: existing } = await sb
    .from("users")
    .select("email")
    .eq("email", emailLc)
    .maybeSingle();
  if (existing) return { ok: false, error: "Email already registered" };
  const hashed = await sha256(password);
  const { error } = await sb.from("users").insert({ name, email: emailLc, password: hashed });
  if (error) return { ok: false, error: error.message };
  return { ok: true as const, user: { name, email: emailLc } };
}

async function login(email: string, password: string) {
  const emailLc = email.toLowerCase();
  const { data, error } = await sb
    .from("users")
    .select("name, email, password")
    .eq("email", emailLc)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Invalid credentials" };
  const hashed = await sha256(password);
  if (data.password !== hashed) return { ok: false, error: "Invalid credentials" };
  return { ok: true as const, user: { name: data.name, email: data.email } };
}

describe("Integration: Auth flow (register + login)", () => {
  beforeAll(cleanupTestData);
  afterAll(cleanupTestData);

  it("I-01 register stores hashed password and returns user", async () => {
    const email = testEmail("i01");
    const r = await register("I01 User", email, "secret123");
    expect(r.ok).toBe(true);
    const { data } = await sb.from("users").select("password, name").eq("email", email).single();
    expect(data?.password).toBe(await sha256("secret123"));
    expect(data?.password).not.toBe("secret123");
  });

  it("I-02 register with existing email returns error, no duplicate row", async () => {
    const email = testEmail("i02");
    await register("A", email, "secret123");
    const r = await register("B", email, "another456");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already registered/i);
    const { data } = await sb.from("users").select("name").eq("email", email);
    expect(data?.length).toBe(1);
  });

  it("I-02b email is normalized to lowercase", async () => {
    const raw = `TEST_MixedCase_${Date.now()}@SQAtest.LOCAL`;
    const r = await register("Mixed", raw, "secret123");
    expect(r.ok).toBe(true);
    const { data } = await sb.from("users").select("email").eq("email", raw.toLowerCase()).single();
    expect(data?.email).toBe(raw.toLowerCase());
  });

  it("I-03 login with correct credentials succeeds", async () => {
    const email = testEmail("i03");
    await register("I03", email, "password1");
    const r = await login(email, "password1");
    expect(r.ok).toBe(true);
    expect(r.user?.email).toBe(email);
  });

  it("I-04 login with wrong password returns generic error", async () => {
    const email = testEmail("i04");
    await register("I04", email, "password1");
    const r = await login(email, "wrongpass");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Invalid credentials");
  });

  it("I-04b login with unknown email returns same generic error (no user enumeration)", async () => {
    const r = await login(`test_unknown_${Date.now()}@sqatest.local`, "whatever1");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Invalid credentials");
  });

  it("I-04c register rejects password shorter than 6 chars", async () => {
    const r = await register("Short", testEmail("i04c"), "abc12");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/at least 6/);
  });

  it("I-04d register rejects empty fields", async () => {
    const r = await register("", testEmail("i04d"), "secret123");
    expect(r.ok).toBe(false);
  });

  it("I-03b demo user login still works against live DB", async () => {
    const r = await login("demo@sqalogic.ca", "demo123");
    expect(r.ok).toBe(true);
    expect(r.user?.name).toBe("Demo User");
  });
});
