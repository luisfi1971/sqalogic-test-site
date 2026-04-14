"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import { sha256 } from "./lib/hash";

type User = { email: string; name: string };

type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

type ReleaseCtx = {
  release: number;
  bump: () => Promise<void>;
  dynId: (base: string) => string;
  dynClass: (base: string) => string;
  attrs: (base: string) => Record<string, string | undefined>;
  randomDelay: () => Promise<void>;
};

export type Booking = {
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

type BookingCtx = {
  bookings: Booking[];
  addBooking: (b: Booking) => Promise<void>;
  pending: Partial<Booking> | null;
  setPending: (b: Partial<Booking> | null) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthCtx | null>(null);
const ReleaseContext = createContext<ReleaseCtx | null>(null);
const BookingContext = createContext<BookingCtx | null>(null);

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
export function useRelease() {
  const c = useContext(ReleaseContext);
  if (!c) throw new Error("useRelease outside provider");
  return c;
}
export function useBooking() {
  const c = useContext(BookingContext);
  if (!c) throw new Error("useBooking outside provider");
  return c;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [release, setRelease] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pending, setPending] = useState<Partial<Booking> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("sqa_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);

  // Load global release counter + subscribe to changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("release_state")
        .select("release")
        .eq("id", 1)
        .maybeSingle();
      if (!cancelled && data) setRelease(data.release);
    })();
    const channel = supabase
      .channel("release-state-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "release_state" },
        (payload) => {
          const next = (payload.new as { release?: number })?.release;
          if (typeof next === "number") setRelease(next);
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Load bookings per user
  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_email", user.email)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) {
          console.error("[bookings] load error:", error);
          setBookings([]);
        } else {
          setBookings(
            (data || []).map((b) => ({
              id: b.id,
              flightId: b.flight_id,
              from: b.from_airport,
              to: b.to_airport,
              date: b.date,
              passenger: b.passenger,
              price: Number(b.price),
              createdAt: b.created_at,
              seat: b.seat ?? null,
              baggage: !!b.baggage,
            }))
          );
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const register: AuthCtx["register"] = async (name, email, password) => {
    if (!name || !email || !password) return { ok: false, error: "All fields are required" };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters" };

    const emailLc = email.toLowerCase();
    const { data: existing } = await supabase
      .from("users")
      .select("email")
      .eq("email", emailLc)
      .maybeSingle();
    if (existing) return { ok: false, error: "Email already registered" };

    const hashed = await sha256(password);
    const { error } = await supabase.from("users").insert({ name, email: emailLc, password: hashed });
    if (error) return { ok: false, error: error.message };

    const u = { name, email: emailLc };
    setUser(u);
    localStorage.setItem("sqa_user", JSON.stringify(u));
    return { ok: true };
  };

  const login: AuthCtx["login"] = async (email, password) => {
    const emailLc = email.toLowerCase();
    const { data, error } = await supabase
      .from("users")
      .select("name, email, password")
      .eq("email", emailLc)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Invalid credentials" };
    const hashed = await sha256(password);
    if (data.password !== hashed) return { ok: false, error: "Invalid credentials" };
    const u = { name: data.name, email: data.email };
    setUser(u);
    localStorage.setItem("sqa_user", JSON.stringify(u));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sqa_user");
  };

  const addBooking = async (b: Booking) => {
    const row = {
      id: b.id,
      user_email: user?.email || null,
      flight_id: b.flightId,
      from_airport: b.from,
      to_airport: b.to,
      date: b.date,
      passenger: b.passenger,
      price: b.price,
      created_at: b.createdAt,
      seat: b.seat ?? null,
      baggage: !!b.baggage,
    };
    const { error } = await supabase.from("bookings").insert(row);
    if (error) {
      console.error("[bookings] insert error:", error);
      return;
    }
    setBookings((prev) => [b, ...prev]);
  };

  const bump = useCallback(async () => {
    const next = release + 1;
    setRelease(next); // optimistic
    const { error } = await supabase
      .from("release_state")
      .update({ release: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) console.error("[release] bump error:", error);
  }, [release]);

  const dynId = useCallback(
    (base: string) => `${base}_v${release}_${hash(base + release)}`,
    [release]
  );
  const dynClass = useCallback(
    (base: string) => `${base}-x${hash(base + release).slice(0, 4)}`,
    [release]
  );
  const attrs = useCallback(
    (base: string): Record<string, string | undefined> => {
      if (release >= 4) {
        return { "data-qa": `${base}-r${release}-${hash(base + release).slice(0, 3)}` };
      }
      if (release >= 3) {
        return { "data-testid": undefined, id: undefined };
      }
      return { "data-testid": base, id: `${base}_v${release}` };
    },
    [release]
  );
  const randomDelay = useCallback(async () => {
    if (release < 2) return;
    const max = Math.min(150 + release * 100, 800);
    const ms = Math.floor(Math.random() * max);
    return new Promise<void>((r) => setTimeout(r, ms));
  }, [release]);

  const authValue = useMemo<AuthCtx>(() => ({ user, login, register, logout }), [user]);
  const releaseValue = useMemo<ReleaseCtx>(
    () => ({ release, bump, dynId, dynClass, attrs, randomDelay }),
    [release, bump, dynId, dynClass, attrs, randomDelay]
  );
  const bookingValue = useMemo<BookingCtx>(
    () => ({ bookings, addBooking, pending, setPending, loading }),
    [bookings, pending, loading]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <ReleaseContext.Provider value={releaseValue}>
        <BookingContext.Provider value={bookingValue}>{children}</BookingContext.Provider>
      </ReleaseContext.Provider>
    </AuthContext.Provider>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
