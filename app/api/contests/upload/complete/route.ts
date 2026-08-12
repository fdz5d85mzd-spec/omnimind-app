import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { completeR2Multipart, deleteR2Objects } from "@/lib/orpheus/_r2.js";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "");
  const challengeId = String(body.challengeId || "");
  const parts = Array.isArray(body.parts) ? body.parts : [];
  if (!key.startsWith(`contests/${challengeId}/`) || !key.includes(`/${userId}/`) || !body.uploadId || !parts.length) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const challenge = await prisma.contestChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.status !== "active" || challenge.endsAt <= new Date()) return NextResponse.json({ error: "Challenge is closed" }, { status: 400 });
  await completeR2Multipart(key, String(body.uploadId), parts);
  try {
    const entry = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
      if (!user || user.creditBalance < challenge.entryCost) throw new Error("NOT_ENOUGH_CREDITS");
      await tx.user.update({ where: { id: userId }, data: { creditBalance: { decrement: challenge.entryCost } } });
      return tx.contestEntry.create({ data: { challengeId, userId, mediaKey: key, mediaType: challenge.mediaType, caption: String(body.caption || "").trim().slice(0, 280) } });
    });
    return NextResponse.json({ entryId: entry.id });
  } catch (error) {
    await Promise.resolve(deleteR2Objects([key])).catch(() => undefined);
    const message = error instanceof Error && error.message === "NOT_ENOUGH_CREDITS" ? "Not enough credits" : "Could not create entry";
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message === "NOT_ENOUGH_CREDITS" ? 402 : 409 });
  }
}
