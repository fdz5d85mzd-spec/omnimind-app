import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const reporterId = session?.user?.id;
  if (!reporterId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { entryId, reason } = await request.json().catch(() => ({}));
  const entry = await prisma.contestEntry.findUnique({ where: { id: String(entryId || "") }, select: { id: true, userId: true } });
  if (!entry || entry.userId === reporterId) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  try { await prisma.contestReport.create({ data: { entryId: entry.id, reporterId, reason: String(reason || "Inappropriate content").slice(0, 120) } }); }
  catch { return NextResponse.json({ error: "Already reported" }, { status: 409 }); }
  const count = await prisma.contestReport.count({ where: { entryId: entry.id } });
  if (count >= 3) await prisma.contestEntry.update({ where: { id: entry.id }, data: { hidden: true } });
  return NextResponse.json({ ok: true });
}
