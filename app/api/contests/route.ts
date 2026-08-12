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
  return NextResponse.json({
    authenticated: Boolean(userId),
    viewerId: userId,
    votedEntryIds: voted.map((vote) => vote.entryId),
    challenges: challenges.map((challenge) => ({ ...challenge, entries: challenge.entries.map(publicEntry) })),
  });
}
