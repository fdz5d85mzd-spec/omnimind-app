import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetEmailHtml, sendEmail } from "@/lib/resend";

const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

// Always returns the same generic message whether or not the email is
// registered -- responding differently would let anyone probe which emails
// have accounts (user enumeration).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // A user who signed up via GitHub OAuth has no password to reset.
    if (user.password) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      const token = randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: { identifier: email, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const base = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${token}`;
      await sendEmail(email, "Reset your OmniMind password", passwordResetEmailHtml(resetUrl));
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
