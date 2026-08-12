import { prisma } from "@/lib/prisma";
import { signedR2View } from "@/lib/orpheus/_r2.js";

export const CONTEST_ENTRY_COST = 15;
export const MAX_VOTES_PER_CHALLENGE = 20;
export const MIN_ENTRIES_FOR_PRIZES = 3;
export const MIN_UNIQUE_VOTERS_FOR_PRIZES = 10;
export const CONTEST_PRIZES = {
  photo: [300, 175, 100] as const,
  reel: [600, 350, 200] as const,
};

const THEMES = [
  ["Small Wonders", "Show us an overlooked detail that deserves the spotlight."],
  ["Future in Motion", "Capture movement, invention, or a glimpse of tomorrow."],
  ["Human Connection", "Tell a visual story about trust, kindness, or belonging."],
  ["Unexpected Joy", "Find a moment that makes people stop scrolling and smile."],
] as const;

function weekWindow(now = new Date()) {
  const startsAt = new Date(now);
  startsAt.setUTCHours(0, 0, 0, 0);
  startsAt.setUTCDate(startsAt.getUTCDate() - ((startsAt.getUTCDay() + 6) % 7));
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 7);
  const epochWeek = Math.floor(startsAt.getTime() / (7 * 86400000));
  return { startsAt, endsAt, epochWeek };
}

export async function ensureWeeklyChallenges() {
  const { startsAt, endsAt, epochWeek } = weekWindow();
  const [title, prompt] = THEMES[Math.abs(epochWeek) % THEMES.length];
  await Promise.all((["photo", "reel"] as const).map((mediaType) => {
    const prizes = CONTEST_PRIZES[mediaType];
    return prisma.contestChallenge.upsert({
      where: { id: `weekly-${mediaType}-${epochWeek}` },
      update: {},
      create: {
        id: `weekly-${mediaType}-${epochWeek}`,
        title: `${title} · ${mediaType === "photo" ? "Photo" : "Reel"}`,
        prompt,
        mediaType,
        startsAt,
        endsAt,
        entryCost: CONTEST_ENTRY_COST,
        prizeFirst: prizes[0],
        prizeSecond: prizes[1],
        prizeThird: prizes[2],
      },
    });
  }));
}

export async function settleEndedChallenges() {
  const challenges = await prisma.contestChallenge.findMany({ where: { status: "active", endsAt: { lte: new Date() } } });
  let awarded = 0;
  for (const challenge of challenges) {
    const uniqueVoters = await prisma.contestVote.findMany({ where: { entry: { challengeId: challenge.id } }, distinct: ["voterId"], select: { voterId: true } });
    const entries = await prisma.contestEntry.findMany({
      where: { challengeId: challenge.id, hidden: false },
      include: { _count: { select: { votes: true } } },
      orderBy: [{ votes: { _count: "desc" } }, { createdAt: "asc" }],
      take: 3,
    });
    const prizes = [challenge.prizeFirst, challenge.prizeSecond, challenge.prizeThird];
    await prisma.$transaction(async (tx) => {
      await tx.contestChallenge.update({ where: { id: challenge.id }, data: { status: "ended" } });
      if (entries.length < MIN_ENTRIES_FOR_PRIZES || uniqueVoters.length < MIN_UNIQUE_VOTERS_FOR_PRIZES) return;
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        const credits = prizes[index];
        await tx.contestAward.create({ data: { challengeId: challenge.id, entryId: entry.id, userId: entry.userId, rank: index + 1, credits } });
        await tx.user.update({ where: { id: entry.userId }, data: { creditBalance: { increment: credits } } });
        awarded += 1;
      }
    });
  }
  return { settled: challenges.length, awarded };
}

export function publicEntry<T extends { mediaKey: string }>(entry: T) {
  const { mediaKey, ...rest } = entry;
  return { ...rest, mediaUrl: signedR2View(mediaKey) };
}
