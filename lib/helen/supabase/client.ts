import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase renamed the client-side key from "anon key" to "publishable key"
// for newer projects (same purpose, safe to expose to the browser) — accept
// either env var name so setup doesn't depend on which naming a given
// project's dashboard shows.
function getPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getPublishableKey());
}

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client. Unused while the app runs on the localStorage
 * mock (lib/data/*) — wire it in once NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are
 * set, by swapping lib/data's repo functions for calls through this client
 * against the tables in supabase/schema.sql. Session is persisted to
 * localStorage by default, so a magic-link sign-in survives a reload.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getPublishableKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  cached = createClient(url, anonKey);
  return cached;
}
