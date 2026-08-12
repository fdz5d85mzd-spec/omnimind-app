import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireMaster } from "@/lib/adminApi";
import { prisma } from "@/lib/prisma";
import { IMPERSONATE_COOKIE } from "@/lib/impersonation";

// Start "view as user" -- gated on the *real* signed-in session (requireMaster
// reads session.user.isAdmin/isMaster, which at this point still reflects the
// caller's own identity since the cookie this route sets doesn't exist yet).
export async function POST(request: NextRequest) {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  (await cookies()).set(IMPERSONATE_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });

  return NextResponse.json({ ok: true });
}

// Exit "view as user". No auth check by design: this only ever clears a
// cookie that could exclusively have been set by the POST handler above, and
// the session callback re-checks the real JWT identity on every request
// regardless -- there's nothing here for an unprivileged caller to gain.
export async function DELETE() {
  (await cookies()).delete(IMPERSONATE_COOKIE);
  return NextResponse.json({ ok: true });
}
