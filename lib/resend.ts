/**
 * Minimal Resend REST wrapper for OmniMind's own transactional emails
 * (password reset), separate from Helen's lib/helen/resend.ts which has its
 * own branded templates — same RESEND_API_KEY / RESEND_FROM_EMAIL env vars,
 * different sender content. Every call is a silent no-op (logged, not
 * thrown) if either is missing, so a missing email config never breaks the
 * flow that calls it.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string
): Promise<boolean> {
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
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
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

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0B0E1A;">
      <h1 style="color: #5B6EF5;">Reset your OmniMind password</h1>
      <p>Click the button below to choose a new password. This link expires in 1 hour and can only be used once.</p>
      <p style="margin-top: 24px;">
        <a href="${resetUrl}" style="background:#5B6EF5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">
          Reset password
        </a>
      </p>
      <p style="margin-top: 24px; font-size: 13px; color: #6B7280;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>
  `;
}
