import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_VOTES_PER_CHALLENGE } from "@/lib/contests";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const voterId = session?.user?.id;
  if (!voterId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { entryId } = await request.json().catch(() => ({}));
  const entry = await prisma.contestEntry.findUnique({ where: { id: String(entryId || "") }, include: { challenge: true } });
  if (!entry || entry.challenge.status !== "active" || entry.challenge.endsAt <= new Date()) return NextResponse.json({ error: "Entry is not open for voting" }, { status: 400 });
  if (entry.userId === voterId) return NextResponse.json({ error: "You cannot vote for your own entry" }, { status: 400 });
  const used = await prisma.contestVote.count({ where: { voterId, entry: { challengeId: entry.challengeId } } });
  if (used >= MAX_VOTES_PER_CHALLENGE) return NextResponse.json({ error: "Voting limit reached for this challenge" }, { status: 429 });
  try {
    await prisma.contestVote.create({ data: { voterId, entryId: entry.id } });
  } catch {
    return NextResponse.json({ error: "You already voted for this entry" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, votesUsed: used + 1, votesLeft: MAX_VOTES_PER_CHALLENGE - used - 1 });
}
