import { NextResponse } from "next/server";
import { requireMaster } from "@/lib/adminApi";
import { seedOgn } from "@/lib/ogn/seed";

export const maxDuration = 60;

export async function POST() {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  if (!process.env.OGN_DATABASE_URL) {
    return NextResponse.json({ error: "OGN_DATABASE_URL is not set yet" }, { status: 501 });
  }

  try {
    const result = await seedOgn();
    return NextResponse.json(result);
  } catch (err) {
    console.error("OGN seed failed", err);
    return NextResponse.json({ error: "Seed failed — check server logs" }, { status: 500 });
  }
}
