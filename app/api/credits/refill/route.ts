import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/billing";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lifetime = PLANS.find((plan) => plan.id === "lifetime")!;
  const now = new Date();
  const due = await prisma.user.findMany({
    where: { plan: "lifetime", creditsRenewAt: { lte: now } },
    select: { id: true, creditsRenewAt: true },
  });
  await Promise.all(due.map((user) => {
    const next = new Date(user.creditsRenewAt ?? now);
    do next.setUTCMonth(next.getUTCMonth() + 1); while (next <= now);
    return prisma.user.update({
      where: { id: user.id },
      data: { creditBalance: { increment: lifetime.monthlyCredits }, creditsRenewAt: next },
    });
  }));
  return NextResponse.json({ refilled: due.length });
}
