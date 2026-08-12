import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/ogn/auth";
import { runPipeline } from "@/lib/ogn/agents/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    const xCronHeader = req.headers.get("x-cron-secret");
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");

    let isCronAuthorized = false;

    if (cronSecret) {
      if (xCronHeader === cronSecret || querySecret === cronSecret) {
        isCronAuthorized = true;
      } else if (authHeader && authHeader === `Bearer ${cronSecret}`) {
        isCronAuthorized = true;
      }
    }

    let isAdminAuthorized = false;
    if (!isCronAuthorized) {
      const session = await getServerSession(authOptions);
      if (session && session.user && (session.user as any).role === "admin") {
        isAdminAuthorized = true;
      }
    }

    if (!isCronAuthorized && !isAdminAuthorized) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Valid CRON_SECRET header or admin session required",
        },
        { status: 401 },
      );
    }

    const result = await runPipeline();

    return NextResponse.json({
      message: "Pipeline executed successfully",
      result,
    });
  } catch (error: any) {
    console.error("[Pipeline POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to execute pipeline", details: error.message },
      { status: 500 },
    );
  }
}

// Vercel Cron invokes routes with GET. Keeping POST as well preserves the
// existing manual/integration caller while making scheduled ingestion real.
export async function GET(req: NextRequest) {
  return POST(req);
}
