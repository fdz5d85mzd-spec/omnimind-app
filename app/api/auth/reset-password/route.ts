import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message || "Invalid request" },
      { status: 400 },
    );
  }
  const { token, password } = result.data;

  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.expires < new Date()) {
      if (record) await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: record.identifier },
      data: { password: hashedPassword },
    });
    // Single-use: the token is consumed whether or not this is the first
    // attempt, so a leaked/shared link can't reset the password twice.
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

    return NextResponse.json({ message: "Password updated" });
  } catch (err) {
    console.error("reset-password failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't reset the password. Try again." }, { status: 500 });
  }
}
