/**
 * Minimal Resend REST wrapper — no SDK dependency, just fetch. Used for
 * transactional emails (welcome, inactivity reminder), separate from the
 * Resend SMTP hookup Supabase Auth uses for magic links. Requires its own
 * RESEND_API_KEY and RESEND_FROM_EMAIL env vars; every call is a silent
 * no-op (logged, not thrown) if either is missing, so a missing email
 * config never breaks the signup/cron flow that calls it.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("sendEmail skipped: RESEND_API_KEY or RESEND_FROM_EMAIL not set");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("sendEmail failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("sendEmail error:", err instanceof Error ? err.message : err);
    return false;
  }
}

export function welcomeEmailHtml(memberId: number): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #241B2F;">
      <h1 style="color: #E8B54D;">Welcome to HELEN 🌍</h1>
      <p>You're member <strong>#${String(memberId).padStart(6, "0")}</strong> — one world, built together, one person at a time.</p>
      <p>Your creature is waiting for you. Come feed it, play with it, and watch it grow — every bit of care (and every membership) feeds our shared Impact Fund.</p>
      <p style="margin-top: 24px;"><a href="https://omnimindai.app/helen/home" style="background:#E8722F;color:#241B2F;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">Open HELEN</a></p>
    </div>
  `;
}

/** Sent to the team (not the member) the moment a new €1 membership lands —
 *  see app/api/webhook/route.ts. Best-effort, same as every other sendEmail
 *  call here: a missing email config never blocks the actual signup. */
export function adminSignupNotificationHtml(memberId: number, email: string | null): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #241B2F;">
      <h1 style="color: #E8B54D;">New HELEN member 🎉</h1>
      <p>Member <strong>#${String(memberId).padStart(6, "0")}</strong> just joined${email ? ` (${email})` : ""}.</p>
    </div>
  `;
}

/** Sent to the team the moment a real shop-item purchase lands. */
export function adminPurchaseNotificationHtml(memberId: number, itemId: string, priceEur: number): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #241B2F;">
      <h1 style="color: #E8B54D;">New shop purchase 🛍️</h1>
      <p>Member <strong>#${String(memberId).padStart(6, "0")}</strong> bought <strong>${itemId}</strong> for ${priceEur.toFixed(2)} €.</p>
    </div>
  `;
}

export function inactivityReminderHtml(memberId: number, creatureName: string | null): string {
  const who = creatureName ?? "your creature";
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #241B2F;">
      <h1 style="color: #E8B54D;">${who} misses you 🥺</h1>
      <p>It's been a week since you last checked in, member <strong>#${String(memberId).padStart(6, "0")}</strong>.</p>
      <p>${who} is waiting for a visit — come feed it, play, and keep your streak alive.</p>
      <p style="margin-top: 24px;"><a href="https://omnimindai.app/helen/home" style="background:#E8722F;color:#241B2F;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">Go say hi</a></p>
    </div>
  `;
}
