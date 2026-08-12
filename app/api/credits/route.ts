import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserWithRefill } from "@/lib/creditsServer";
import { FREE_STARTING_CREDITS } from "@/lib/credits";
import { PLANS } from "@/lib/billing";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const user = await getUserWithRefill(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    creditBalance: user.creditBalance,
    plan: user.plan,
    cooldownUntil: user.cooldownUntil,
    creditsRenewAt: user.creditsRenewAt,
    allowance: PLANS.find((plan) => plan.id === user.plan)?.monthlyCredits ?? FREE_STARTING_CREDITS,
  });
}
