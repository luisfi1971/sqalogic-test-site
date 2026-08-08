"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { sha256 } from "./lib/hash";
import { LATENCY_KEY, resolveLatency } from "./lib/latency";

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

export type BookingStatus = "active" | "cancelled";

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
  status?: BookingStatus;
};

type BookingCtx = {
  bookings: Booking[];
  addBooking: (b: Booking) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  pending: Partial<Booking> | null;
  setPending: (b: Partial<Booking> | null) => void;
  loading: boolean;
};

/**
 * Latency mode. Off by default — a permanently slow site is a bad test bed,
 * because it makes every suite slow without proving anything extra. Turned on
 * with `?latency=1` at page load and remembered for the session, so it survives
 * the five client-side hops of the booking flow; `?latency=0` turns it off.
 */
type LatencyCtx = {
  latency: boolean;
  setLatency: (on: boolean) => void;
  /** A duration in latency mode, zero when the mode is off. */
  scale: (ms: number) => number;
  /** Resolves after a scaled delay, or immediately when the mode is off. */
  wait: (ms: number) => Promise<void>;
};

export type ToastKind = "success" | "info" | "error";
export type Toast = { id: number; message: string; kind: ToastKind };

type ToastCtx = {
  toasts: Toast[];
  toast: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
};

const AuthContext = createContext<AuthCtx | null>(null);
const ReleaseContext = createContext<ReleaseCtx | null>(null);
const BookingContext = createContext<BookingCtx | null>(null);
const LatencyContext = createContext<LatencyCtx | null>(null);
const ToastContext = createContext<ToastCtx | null>(null);

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
export function useLatency() {
  const c = useContext(LatencyContext);
  if (!c) throw new Error("useLatency outside provider");
  return c;
}
export function useToast() {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useToast outside provider");
  return c;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [release, setRelease] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pending, setPending] = useState<Partial<Booking> | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatencyState] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hiddenBookings, setHiddenBookings] = useState<string[]>([]);
  const toastSeq = useRef(0);

  // Read `?latency=` once per page load, then fall back to the session value.
  useEffect(() => {
    try {
      const on = resolveLatency(window.location.search, sessionStorage.getItem(LATENCY_KEY));
      sessionStorage.setItem(LATENCY_KEY, on ? "1" : "0");
      if (on) setLatencyState(true);
    } catch {}
  }, []);

  const setLatency = useCallback((on: boolean) => {
    setLatencyState(on);
    try {
      sessionStorage.setItem(LATENCY_KEY, on ? "1" : "0");
    } catch {}
  }, []);

  const scale = useCallback((ms: number) => (latency ? ms : 0), [latency]);
  const wait = useCallback(
    (ms: number) => (latency ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve()),
    [latency]
  );

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastCtx["toast"]>(
    (message, kind = "success") => {
      const id = ++toastSeq.current;
      // In latency mode the toast lands late, so a test cannot assert it the
      // instant the action fires — it has to wait for the text to appear.
      const appearAfter = latency ? 900 : 0;
      const life = latency ? 6000 : 4000;
      const show = () => {
        setToasts((list) => [...list, { id, message, kind }]);
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), life);
      };
      if (appearAfter) setTimeout(show, appearAfter);
      else show();
    },
    [latency]
  );

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
              status: (b.status as BookingStatus) ?? "active",
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
      status: b.status ?? "active",
    };
    const { error } = await supabase.from("bookings").insert(row);
    if (error) {
      console.error("[bookings] insert error:", error);
      return;
    }
    setBookings((prev) => [{ ...b, status: b.status ?? "active" }, ...prev]);

    // Eventual consistency: in latency mode the write lands but the read model
    // lags, so the trip is missing from My Trips for a few seconds. That is the
    // target for a reload-probe — poll-and-reload until it shows up.
    if (latency) {
      setHiddenBookings((ids) => [...ids, b.id]);
      setTimeout(() => setHiddenBookings((ids) => ids.filter((x) => x !== b.id)), 3500);
    }
  };

  const cancelBooking = async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      console.error("[bookings] cancel error:", error);
      return;
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
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
  const visibleBookings = useMemo(
    () => (hiddenBookings.length ? bookings.filter((b) => !hiddenBookings.includes(b.id)) : bookings),
    [bookings, hiddenBookings]
  );
  const bookingValue = useMemo<BookingCtx>(
    () => ({ bookings: visibleBookings, addBooking, cancelBooking, pending, setPending, loading }),
    [visibleBookings, pending, loading]
  );
  const latencyValue = useMemo<LatencyCtx>(
    () => ({ latency, setLatency, scale, wait }),
    [latency, setLatency, scale, wait]
  );
  const toastValue = useMemo<ToastCtx>(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <AuthContext.Provider value={authValue}>
      <ReleaseContext.Provider value={releaseValue}>
        <LatencyContext.Provider value={latencyValue}>
          <ToastContext.Provider value={toastValue}>
            <BookingContext.Provider value={bookingValue}>{children}</BookingContext.Provider>
          </ToastContext.Provider>
        </LatencyContext.Provider>
      </ReleaseContext.Provider>
    </AuthContext.Provider>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
