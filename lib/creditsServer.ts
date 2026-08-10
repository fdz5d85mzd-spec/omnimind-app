import { prisma } from "@/lib/prisma";
import { FREE_REFILL_CREDITS } from "@/lib/credits";
import type { User } from "@prisma/client";

// Lazily refills a free-tier user once their cooldown has passed, instead
// of needing a cron job: the moment anything asks for this user's credit
// state after the cooldown window closes, they're topped back up.
export async function getUserWithRefill(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.cooldownUntil && user.cooldownUntil.getTime() <= Date.now() && user.creditBalance <= 0) {
    return prisma.user.update({
      where: { id: userId },
      data: { creditBalance: FREE_REFILL_CREDITS, cooldownUntil: null },
    });
  }
  return user;
}
