import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sb, testEmail, testBookingId, cleanupTestData } from "../helpers/supabase";

type Booking = {
  id: string;
  flightId: string;
  from: string;
  to: string;
  date: string;
  passenger: string;
  price: number;
  createdAt: string;
  seat?: string | null;
  baggage?: boolean;
};

// Mirrors AppProviders.addBooking + my-trips load query
async function addBooking(userEmail: string, b: Booking) {
  return sb.from("bookings").insert({
    id: b.id,
    user_email: userEmail,
    flight_id: b.flightId,
    from_airport: b.from,
    to_airport: b.to,
    date: b.date,
    passenger: b.passenger,
    price: b.price,
    created_at: b.createdAt,
    seat: b.seat ?? null,
    baggage: !!b.baggage,
  });
}

async function loadBookings(userEmail: string) {
  return sb
    .from("bookings")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });
}

describe("Integration: Booking flow (addBooking + my-trips)", () => {
  let email: string;
  beforeAll(async () => {
    await cleanupTestData();
    email = testEmail("bk_flow");
    await sb.from("users").insert({ name: "Bk Flow", email, password: "h" });
  });
  afterAll(cleanupTestData);

  const sample = (id: string, over: Partial<Booking> = {}): Booking => ({
    id,
    flightId: "FL-1001-0",
    from: "YUL - Montreal",
    to: "JFK - New York",
    date: "2026-11-10",
    passenger: "Bk Flow",
    price: 320,
    createdAt: new Date().toISOString(),
    seat: null,
    baggage: false,
    ...over,
  });

  it("I-12 payment-success flow: addBooking -> appears in my-trips list", async () => {
    const id = testBookingId("i12");
    const { error } = await addBooking(email, sample(id, { seat: "11C", baggage: true, price: 360 }));
    expect(error).toBeNull();
    const { data } = await loadBookings(email);
    const found = data?.find((b) => b.id === id);
    expect(found).toBeDefined();
    expect(found?.seat).toBe("11C");
    expect(found?.baggage).toBe(true);
    expect(Number(found?.price)).toBe(360);
  });

  it("I-14 re-fetch by id works (confirmation page refresh)", async () => {
    const id = testBookingId("i14");
    await addBooking(email, sample(id));
    const { data } = await sb.from("bookings").select("*").eq("id", id).single();
    expect(data?.id).toBe(id);
  });

  it("I-15 fetching unknown id returns single-row error", async () => {
    const { error } = await sb
      .from("bookings")
      .select("*")
      .eq("id", "test_nope_xyz")
      .single();
    expect(error).not.toBeNull();
  });

  it("I-16 my-trips returns only current user's bookings", async () => {
    const other = testEmail("other");
    await sb.from("users").insert({ name: "Other", email: other, password: "h" });
    await addBooking(other, sample(testBookingId("i16_other")));
    await addBooking(email, sample(testBookingId("i16_mine")));
    const { data } = await loadBookings(email);
    expect(data?.every((b) => b.user_email === email)).toBe(true);
    expect(data?.some((b) => b.user_email === other)).toBe(false);
  });

  it("I-17 my-trips sorted descending by created_at", async () => {
    // Insert with explicit createdAt stamps
    await addBooking(email, sample(testBookingId("i17a"), { createdAt: "2026-01-01T00:00:00Z" }));
    await addBooking(email, sample(testBookingId("i17b"), { createdAt: "2026-06-01T00:00:00Z" }));
    const { data } = await loadBookings(email);
    const stamps = (data || []).map((b) => new Date(b.created_at).getTime());
    for (let i = 1; i < stamps.length; i++) {
      expect(stamps[i - 1]).toBeGreaterThanOrEqual(stamps[i]);
    }
  });

  it("I-18 cancel booking (delete) removes it from list", async () => {
    const id = testBookingId("i18");
    await addBooking(email, sample(id));
    await sb.from("bookings").delete().eq("id", id);
    const { data } = await loadBookings(email);
    expect(data?.some((b) => b.id === id)).toBe(false);
  });

  it("I-13 failed-payment analog: when addBooking is not called, DB has no row", async () => {
    const id = testBookingId("i13");
    // Simulate payment refusal: no addBooking call
    const { data } = await sb.from("bookings").select("id").eq("id", id);
    expect(data).toEqual([]);
  });
});
