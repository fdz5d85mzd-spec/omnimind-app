import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/helen/supabase/server";

/**
 * Backs the /live broadcast screen (app/live/page.tsx) — real member count
 * plus the most recent signups, for a "member #4 just joined!" ticker.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, memberCount: 0, recentMembers: [] });
  }

  const supabase = getSupabaseServerClient();

  const [{ count: memberCount, error: countError }, { data: recent, error: recentError }] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id, username, tier, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  if (countError || recentError) {
    return NextResponse.json({ error: (countError ?? recentError)?.message ?? "Unknown error" }, { status: 500 });
  }

  return NextResponse.json(
    {
      configured: true,
      memberCount: memberCount ?? 0,
      recentMembers: (recent ?? []).map((m) => ({
        id: m.id as number,
        username: m.username as string | null,
        tier: m.tier as string,
        createdAt: m.created_at as string,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } },
  );
}
