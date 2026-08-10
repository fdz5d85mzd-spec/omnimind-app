import { NextResponse } from "next/server";
import { requireAdminOrMaster } from "@/lib/adminApi";
import { getRevenueSnapshot } from "@/lib/adminRevenue";

export async function GET() {
  const check = await requireAdminOrMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
  return NextResponse.json(await getRevenueSnapshot());
}
