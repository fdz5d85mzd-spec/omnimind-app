import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";
import { supportContactEmails } from "@/lib/roles";

// The Help widget's "still need a person?" escalation -- a real inbox via
// the same Resend integration the password-reset flow already uses, not a
// fabricated live-chat. The sender's address never leaves the server: it's
// only used as the reply-to header so a reply from the owner's inbox goes
// straight back to them.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
  if (message.length > 2000) {
    return NextResponse.json({ error: "message is too long (max 2000 characters)" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const fromEmail = session?.user?.email || String(body.email ?? "").trim() || undefined;
  const fromName = session?.user?.name || "A visitor";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0B0E1A;">
      <h1 style="color: #5B6EF5; font-size: 18px;">New Help widget message</h1>
      <p style="color: #6B7280; font-size: 13px;">From: ${fromName}${fromEmail ? ` &lt;${fromEmail}&gt;` : " (no email given)"}</p>
      <p style="white-space: pre-wrap; margin-top: 16px;">${message.replace(/</g, "&lt;")}</p>
    </div>
  `;

  const sent = await sendEmail(supportContactEmails(), "OmniMind Help widget message", html, fromEmail);
  if (!sent) return NextResponse.json({ error: "Email is not configured right now" }, { status: 502 });

  return NextResponse.json({ ok: true });
}
