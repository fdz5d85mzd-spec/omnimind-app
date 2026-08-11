import { getSupabaseServerClient } from "@/lib/helen/supabase/server";
import { tierFor } from "@/lib/helen/domain";
import { adminSignupNotificationHtml, sendEmail, welcomeEmailHtml } from "@/lib/helen/resend";

const TEAM_NOTIFICATION_EMAIL = "helpdesk@omnimindai.app";

/**
 * Creates the members row for a paid-up Supabase user. Shared by the Stripe
 * webhook (card payments) and the credits-payment join route, so there's
 * one place that knows how a member actually gets created -- `id` is
 * intentionally omitted from the insert; its column default
 * (nextval('member_id_seq'), see supabase/schema.sql) is what makes
 * assignment race-safe under concurrent calls. `tier` needs a value up
 * front, so insert with a placeholder and fix it up once Postgres has
 * assigned the real id.
 */
export async function createHelenMembership(
  userId: string,
  username: string | null,
): Promise<{ id: number } | { error: string }> {
  const supabase = getSupabaseServerClient();

  const { data: inserted, error: insertError } = await supabase
    .from("members")
    .insert({ user_id: userId, tier: tierFor(0), username })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  const { error: tierError } = await supabase.from("members").update({ tier: tierFor(inserted.id) }).eq("id", inserted.id);
  if (tierError) return { error: tierError.message };

  // Best-effort welcome + team notification emails — never block on failure.
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  if (authUser?.user?.email) {
    sendEmail(authUser.user.email, "Welcome to HELEN 🌍", welcomeEmailHtml(inserted.id)).catch(() => {});
  }
  sendEmail(
    TEAM_NOTIFICATION_EMAIL,
    `New HELEN member #${String(inserted.id).padStart(6, "0")}`,
    adminSignupNotificationHtml(inserted.id, authUser?.user?.email ?? null),
  ).catch(() => {});

  return { id: inserted.id };
}
