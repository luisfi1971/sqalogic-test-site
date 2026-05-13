import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sb, testEmail, testBookingId, cleanupTestData } from "../helpers/supabase";

describe("API: bookings table (Supabase real)", () => {
  let userEmail: string;

  beforeAll(async () => {
    await cleanupTestData();
    userEmail = testEmail("bk_owner");
    const { error } = await sb
      .from("users")
      .insert({ name: "Bk Owner", email: userEmail, password: "h" });
    if (error) throw error;
  });
  afterAll(cleanupTestData);

  const makeBooking = (id: string, overrides: Partial<Record<string, unknown>> = {}) => ({
    id,
    user_email: userEmail,
    flight_id: "FL-1001-0",
    from_airport: "YUL - Montreal",
    to_airport: "JFK - New York",
    date: "2026-12-01",
    passenger: "Test Passenger",
    price: 320,
    ...overrides,
  });

  it("A-06 inserts valid booking and fills created_at", async () => {
    const id = testBookingId("a06");
    const { data, error } = await sb
      .from("bookings")
      .insert(makeBooking(id))
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBe(id);
    expect(data?.created_at).toBeTruthy();
    expect(data?.baggage).toBe(false);
    expect(data?.seat).toBeNull();
  });

  it("A-07 invalid user_email violates FK (23503)", async () => {
    const id = testBookingId("a07");
    const { error } = await sb
      .from("bookings")
      .insert(makeBooking(id, { user_email: "nonexistent@nowhere.zzz" }));
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23503");
  });

  it("A-08 deleting user cascades to bookings", async () => {
    const email = testEmail("a08");
    await sb.from("users").insert({ name: "A08", email, password: "h" });
    const id = testBookingId("a08");
    const { error: insErr } = await sb
      .from("bookings")
      .insert(makeBooking(id, { user_email: email }))
      .select();
    expect(insErr).toBeNull();
    await sb.from("users").delete().eq("email", email);
    const { data } = await sb.from("bookings").select("id").eq("id", id);
    expect(data).toEqual([]);
  });

  it("A-09 price negative IS accepted by schema (documented gap)", async () => {
    const id = testBookingId("a09");
    const { error } = await sb
      .from("bookings")
      .insert(makeBooking(id, { price: -50 }))
      .select();
    expect(error).toBeNull();
  });

  it("A-10 missing flight_id violates NOT NULL", async () => {
    const id = testBookingId("a10");
    // @ts-expect-error intentional null
    const payload = makeBooking(id, { flight_id: null });
    const { error } = await sb.from("bookings").insert(payload);
    expect(error).not.toBeNull();
    expect(error?.code).toMatch(/23502|23514/);
  });

  it("A-11 optional seat and baggage defaults apply when omitted", async () => {
    const id = testBookingId("a11");
    const { error } = await sb.from("bookings").insert(makeBooking(id)).select();
    expect(error).toBeNull();
    const { data } = await sb.from("bookings").select("seat, baggage").eq("id", id).single();
    expect(data?.seat).toBeNull();
    expect(data?.baggage).toBe(false);
  });

  it("A-11b seat and baggage persist when provided", async () => {
    const id = testBookingId("a11b");
    const { error } = await sb
      .from("bookings")
      .insert(makeBooking(id, { seat: "12A", baggage: true }))
      .select();
    expect(error).toBeNull();
    const { data } = await sb.from("bookings").select("seat, baggage").eq("id", id).single();
    expect(data?.seat).toBe("12A");
    expect(data?.baggage).toBe(true);
  });

  it("A-12 SELECT filtered by user_email returns only that user's bookings", async () => {
    const id = testBookingId("a12");
    const { error } = await sb.from("bookings").insert(makeBooking(id)).select();
    expect(error).toBeNull();
    const { data } = await sb
      .from("bookings")
      .select("id, user_email")
      .eq("user_email", userEmail);
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.every((b) => b.user_email === userEmail)).toBe(true);
  });
});
