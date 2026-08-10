import { createClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
  );
}

/**
 * Server-only Supabase client using the service role key — bypasses RLS.
 * Only ever import this from API routes (app/api/**), never from client
 * components. Used by the Stripe webhook to atomically assign a Member ID
 * (via the member_id_seq sequence in supabase/schema.sql) after payment
 * is confirmed.
 */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  // Supabase renamed "service_role key" to "secret key" for newer projects —
  // accept either env var name, same as the browser client does for the
  // anon/publishable key.
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only, never NEXT_PUBLIC_)",
    );
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
