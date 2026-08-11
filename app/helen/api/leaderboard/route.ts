import { NextResponse } from "next/server";
import { MEMBERSHIP_PRICE_EUR } from "@/lib/helen/domain";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/helen/supabase/server";

/**
 * Real leaderboard entries — id/tier/username come straight from `members`
 * (publicly readable via RLS), but shop_purchases is locked to "read own"
 * per-member, so totalContributed has to be aggregated here with the
 * service role key rather than client-side.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, entries: [] });
  }

  const supabase = getSupabaseServerClient();

  const [{ data: members, error: membersError }, { data: purchases, error: purchasesError }] = await Promise.all([
    supabase.from("members").select("id, tier, username").order("id", { ascending: true }).limit(500),
    supabase.from("shop_purchases").select("member_id, amount_eur"),
  ]);

  if (membersError || purchasesError) {
    console.error("helen leaderboard: Supabase read failed", membersError ?? purchasesError);
    return NextResponse.json({ error: "Leaderboard isn't available right now" }, { status: 500 });
  }

  const contributionByMember = new Map<number, number>();
  for (const row of purchases ?? []) {
    contributionByMember.set(row.member_id, (contributionByMember.get(row.member_id) ?? 0) + Number(row.amount_eur));
  }

  const entries = (members ?? []).map((m) => ({
    id: m.id as number,
    tier: m.tier as string,
    username: m.username as string | null,
    totalContributed: MEMBERSHIP_PRICE_EUR + (contributionByMember.get(m.id as number) ?? 0),
  }));

  return NextResponse.json(
    { configured: true, entries },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } },
  );
}
