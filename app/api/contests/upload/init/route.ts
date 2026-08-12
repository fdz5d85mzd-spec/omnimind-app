import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createR2Multipart } from "@/lib/orpheus/_r2.js";

const TYPES = { photo: new Set(["image/jpeg", "image/png", "image/webp"]), reel: new Set(["video/mp4", "video/webm", "video/quicktime"]) };
const MAX = { photo: 20 * 1024 ** 2, reel: 150 * 1024 ** 2 };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const challenge = await prisma.contestChallenge.findUnique({ where: { id: String(body.challengeId || "") } });
  if (!challenge || challenge.status !== "active" || challenge.endsAt <= new Date()) return NextResponse.json({ error: "Challenge is closed" }, { status: 400 });
  const mediaType = challenge.mediaType as "photo" | "reel";
  const size = Number(body.size);
  const contentType = String(body.contentType || "");
  if (!TYPES[mediaType]?.has(contentType) || !Number.isFinite(size) || size <= 0 || size > MAX[mediaType]) return NextResponse.json({ error: `Invalid ${mediaType} file` }, { status: 400 });
  const [existing, user] = await Promise.all([
    prisma.contestEntry.findUnique({ where: { challengeId_userId: { challengeId: challenge.id, userId } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } }),
  ]);
  if (existing) return NextResponse.json({ error: "You already entered this challenge" }, { status: 409 });
  if (!user || user.creditBalance < challenge.entryCost) return NextResponse.json({ error: `You need ${challenge.entryCost} credits to enter` }, { status: 402 });
  const safeName = String(body.name || "media").replace(/[^a-z0-9._-]/gi, "-").slice(-90);
  const key = `contests/${challenge.id}/${userId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await createR2Multipart(key, contentType);
  return NextResponse.json({ key, uploadId: upload.uploadId, partSize: 10 * 1024 ** 2 });
}
