import { NextRequest, NextResponse } from "next/server";
import { ensureWeeklyChallenges, settleEndedChallenges } from "@/lib/contests";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await settleEndedChallenges();
  await ensureWeeklyChallenges();
  return NextResponse.json(result);
}
