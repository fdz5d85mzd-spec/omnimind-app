import { NextResponse } from "next/server";
import { requireMaster } from "@/lib/adminApi";
import { runPipeline } from "@/lib/ogn/agents/orchestrator";

// Same pipeline as app/ogn/api/pipeline/route.ts (which needs CRON_SECRET,
// for the hourly Vercel Cron job) -- this one is gated on an OmniMind admin
// session instead, for the "Run now" button in /admin/ogn.
export const maxDuration = 300;

export async function POST() {
  const check = await requireMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  if (!process.env.OGN_DATABASE_URL) {
    return NextResponse.json({ error: "OGN_DATABASE_URL is not set yet" }, { status: 501 });
  }

  try {
    const result = await runPipeline();
    return NextResponse.json({ result });
  } catch (err) {
    console.error("OGN pipeline run failed", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Pipeline run failed", detail }, { status: 500 });
  }
}
