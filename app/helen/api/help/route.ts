import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/helen/resend";

const TEAM_EMAIL = "helpdesk@omnimindai.app";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; message?: string };
  const email = body.email?.trim().slice(0, 200);
  const message = body.message?.trim().slice(0, 4000);

  if (!email || !email.includes("@") || !message) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const sent = await sendEmail(
    TEAM_EMAIL,
    `Help request from ${email}`,
    `<div style="font-family: sans-serif;">
      <p><strong>From:</strong> ${email}</p>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>`,
  );

  if (!sent) {
    return NextResponse.json({ error: "Could not send — try again later" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
