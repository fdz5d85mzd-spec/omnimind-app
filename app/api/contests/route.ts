import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureWeeklyChallenges, publicEntry } from "@/lib/contests";

export async function GET() {
  await ensureWeeklyChallenges();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const challenges = await prisma.contestChallenge.findMany({
    orderBy: [{ status: "asc" }, { endsAt: "desc" }],
    take: 8,
    include: {
      entries: {
        where: { hidden: false },
        include: { user: { select: { name: true } }, _count: { select: { votes: true } } },
        orderBy: [{ votes: { _count: "desc" } }, { createdAt: "asc" }],
        take: 60,
      },
      awards: { orderBy: { rank: "asc" }, include: { user: { select: { name: true } } } },
    },
  });
  const voted = userId ? await prisma.contestVote.findMany({ where: { voterId: userId }, select: { entryId: true } }) : [];
  const exposureKey = `${userId ?? "guest"}:${new Date().toISOString().slice(0, 10)}`;
  const exposureScore = (id: string) => {
    let hash = 2166136261;
    for (const char of `${exposureKey}:${id}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return hash >>> 0;
  };
  return NextResponse.json({
    authenticated: Boolean(userId),
    viewerId: userId,
    votedEntryIds: voted.map((vote) => vote.entryId),
    challenges: challenges.map((challenge) => {
      const entries = challenge.entries.map(publicEntry);
      const votingEntries = [...entries].sort((a, b) => a._count.votes - b._count.votes || exposureScore(a.id) - exposureScore(b.id));
      return { ...challenge, entries, votingEntries };
    }),
  });
}
