import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Warn once at module load; pages still render but DB calls will throw.
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url || "http://localhost", key || "anon", {
  auth: { persistSession: false },
});

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
};

export type DbBooking = {
  id: string;
  user_email: string | null;
  flight_id: string;
  from_airport: string;
  to_airport: string;
  date: string;
  passenger: string;
  price: number;
  created_at: string;
};
