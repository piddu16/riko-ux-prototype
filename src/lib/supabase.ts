/* Supabase browser client.
 * Read-only — the anon key + RLS policies are what protect the data.
 * No service-role key used anywhere; all mutations happen outside this app. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Soft warning rather than throw — allows the prototype to render mock data
  // when env vars aren't set (useful during development before schema is wired).
  if (typeof window !== "undefined") {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing. " +
        "Live queries will fall through to mock data in src/lib/data.ts.",
    );
  }
}

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

/** True when live Supabase is configured. Components can fall back to data.ts when false. */
export const isLiveSupabase = Boolean(url && anonKey);
