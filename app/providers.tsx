"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

type User = { email: string; name: string };

type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

type ReleaseCtx = {
  release: number;
  bump: () => void;
  dynId: (base: string) => string;
  dynClass: (base: string) => string;
  attrs: (base: string) => Record<string, string | undefined>;
  randomDelay: () => Promise<void>;
};

type Booking = {
  id: string;
  flightId: string;
  from: string;
  to: string;
  date: string;
  passenger: string;
  price: number;
  createdAt: string;
};

type BookingCtx = {
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  pending: Partial<Booking> | null;
  setPending: (b: Partial<Booking> | null) => void;
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

type StoredUser = { name: string; email: string; password: string };

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [release, setRelease] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pending, setPending] = useState<Partial<Booking> | null>(null);

  useEffect(() => {
    try {
      // Seed a demo user on first visit
      const seeded = localStorage.getItem("sqa_seeded");
      if (!seeded) {
        const demoUsers: StoredUser[] = [
          { name: "Demo User", email: "demo@sqalogic.ca", password: "demo123" },
        ];
        const demoBookings: Booking[] = [
          {
            id: "BK-DEMO1",
            flightId: "FL-1001-0",
            from: "YUL - Montreal",
            to: "JFK - New York",
            date: "2026-05-01",
            passenger: "Demo User",
            price: 320,
            createdAt: "2026-04-01T12:00:00.000Z",
          },
          {
            id: "BK-DEMO2",
            flightId: "FL-1001-2",
            from: "YYZ - Toronto",
            to: "LHR - London",
            date: "2026-06-14",
            passenger: "Demo User",
            price: 890,
            createdAt: "2026-04-03T09:30:00.000Z",
          },
          {
            id: "BK-DEMO3",
            flightId: "FL-1001-3",
            from: "GRU - Sao Paulo",
            to: "CDG - Paris",
            date: "2026-07-22",
            passenger: "Demo User",
            price: 1240,
            createdAt: "2026-04-05T15:10:00.000Z",
          },
        ];
        localStorage.setItem("sqa_users", JSON.stringify(demoUsers));
        localStorage.setItem("sqa_bookings", JSON.stringify(demoBookings));
        localStorage.setItem("sqa_seeded", "1");
      }
      const u = localStorage.getItem("sqa_user");
      if (u) setUser(JSON.parse(u));
      const b = localStorage.getItem("sqa_bookings");
      if (b) setBookings(JSON.parse(b));
      const r = localStorage.getItem("sqa_release");
      if (r) setRelease(parseInt(r, 10) || 1);
    } catch {}
  }, []);

  const persistUsers = (users: StoredUser[]) => {
    localStorage.setItem("sqa_users", JSON.stringify(users));
  };
  const readUsers = (): StoredUser[] => {
    try {
      return JSON.parse(localStorage.getItem("sqa_users") || "[]");
    } catch {
      return [];
    }
  };

  const register: AuthCtx["register"] = (name, email, password) => {
    if (!name || !email || !password) return { ok: false, error: "All fields are required" };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters" };
    const users = readUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "Email already registered" };
    }
    users.push({ name, email, password });
    persistUsers(users);
    const u = { name, email };
    setUser(u);
    localStorage.setItem("sqa_user", JSON.stringify(u));
    return { ok: true };
  };

  const login: AuthCtx["login"] = (email, password) => {
    const users = readUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) return { ok: false, error: "Invalid credentials" };
    const u = { name: found.name, email: found.email };
    setUser(u);
    localStorage.setItem("sqa_user", JSON.stringify(u));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sqa_user");
  };

  const addBooking = (b: Booking) => {
    setBookings((prev) => {
      const next = [...prev, b];
      localStorage.setItem("sqa_bookings", JSON.stringify(next));
      return next;
    });
  };

  const bump = useCallback(() => {
    setRelease((r) => {
      const next = r + 1;
      localStorage.setItem("sqa_release", String(next));
      return next;
    });
  }, []);

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
      // Higher releases progressively strip/rotate attributes
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
  const bookingValue = useMemo<BookingCtx>(() => ({ bookings, addBooking, pending, setPending }), [bookings, pending]);

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
