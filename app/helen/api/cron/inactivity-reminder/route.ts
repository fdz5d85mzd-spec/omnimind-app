import { NextResponse } from "next/server";
import { inactivityReminderHtml, sendEmail } from "@/lib/helen/resend";
import { getSupabaseServerClient } from "@/lib/helen/supabase/server";

/**
 * Runs daily (see vercel.json's `crons` entry). Emails any member who hasn't
 * opened the app in 7+ days and hasn't already been reminded in the last 7
 * days (tracked via `last_reminder_sent_date`, see supabase/schema.sql).
 *
 * Protected by CRON_SECRET — Vercel Cron sends `Authorization: Bearer
 * $CRON_SECRET` automatically once that env var is set; without it, this
 * route is open (fine for local testing, not for production — set
 * CRON_SECRET before relying on this).
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let supabase: ReturnType<typeof getSupabaseServerClient>;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 501 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data: inactive, error } = await supabase
    .from("members")
    .select("id, user_id, creature_name, last_active_date, last_reminder_sent_date")
    .lt("last_active_date", cutoffStr)
    .or(`last_reminder_sent_date.is.null,last_reminder_sent_date.lt.${cutoffStr}`);

  if (error) {
    console.error("inactivity-reminder query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const member of inactive ?? []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const ok = await sendEmail(
      email,
      "We miss you at HELEN 🥺",
      inactivityReminderHtml(member.id, member.creature_name),
    );
    if (ok) {
      sent += 1;
      await supabase
        .from("members")
        .update({ last_reminder_sent_date: new Date().toISOString().slice(0, 10) })
        .eq("id", member.id);
    }
  }

  return NextResponse.json({ checked: inactive?.length ?? 0, sent });
}
