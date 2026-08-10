import { getSupabaseBrowserClient } from "./client";

/**
 * Item ids owned by a member, per shop_purchases (supabase/schema.sql).
 * Used to sync app/home/shop/page.tsx after a real Stripe purchase — the
 * webhook can trail the redirect back from Stripe by a moment, same as
 * lib/supabase/members.ts's fetchMemberByUserId.
 */
export async function fetchOwnedItemIds(memberId: number): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("shop_purchases")
    .select("item_id")
    .eq("member_id", memberId);
  if (error) throw error;
  return (data ?? []).map((row) => row.item_id as string);
}
