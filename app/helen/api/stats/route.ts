import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured as isSupabaseServerConfigured } from "@/lib/helen/supabase/server";

/**
 * Real, global numbers behind the "Members worldwide" / Impact Fund totals —
 * these feed a public charity-funding commitment, so they must reflect the
 * actual members/shop_purchases tables, never the per-browser localStorage
 * mock counters in lib/data/*. Cached at the edge for a few seconds since
 * every home/impact page view calls this.
 */
export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ configured: false, memberCount: null, shopRevenueEur: null });
  }

  const supabase = getSupabaseServerClient();

  const [{ count: memberCount, error: memberError }, { data: purchases, error: purchaseError }] =
    await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("shop_purchases").select("amount_eur"),
    ]);

  if (memberError || purchaseError) {
    console.error("helen stats: Supabase read failed", memberError ?? purchaseError);
    return NextResponse.json({ error: "Stats aren't available right now" }, { status: 500 });
  }

  const shopRevenueEur = (purchases ?? []).reduce((sum, row) => sum + Number(row.amount_eur), 0);

  return NextResponse.json(
    { configured: true, memberCount: memberCount ?? 0, shopRevenueEur },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } },
  );
}
