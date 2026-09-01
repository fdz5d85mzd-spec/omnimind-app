import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserWithRefill } from "@/lib/creditsServer";
import { VIDEO_GENERATION_CREDITS } from "@/lib/billing";
import { animateSceneImage, isHiggsfieldConfigured } from "@/lib/voxstudio/higgsfield";
import { createJobIfOwned, finishJob } from "@/lib/voxstudio/jobs";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isHiggsfieldConfigured()) {
    return NextResponse.json(
      { error: "temporarily_unavailable", message: "Video generation is temporarily unavailable." },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required to generate videos" }, { status: 401 });
  }
  const user = await getUserWithRefill(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPrivileged = Boolean(session.user.isMaster || session.user.isAdmin);
  if (!isPrivileged && user.creditBalance < VIDEO_GENERATION_CREDITS) {
    return NextResponse.json(
      { error: "blocked", reason: "no_credits", need: VIDEO_GENERATION_CREDITS, have: user.creditBalance },
      { status: 402 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    imageUrl?: string;
    prompt?: string;
    projectId?: string;
    sceneIndex?: number;
  };
  const imageUrl = (body.imageUrl ?? "").trim();
  const prompt = (body.prompt ?? "").trim();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  if (prompt.length > 1000) return NextResponse.json({ error: "prompt is too long (max 1000 characters)" }, { status: 400 });

  let jobId: string | null = null;
  if (body.projectId) {
    jobId = await createJobIfOwned(session.user.id, body.projectId, "video", {
      prompt,
      imageUrl,
      sceneIndex: body.sceneIndex ?? null,
    });
  }

  const result = await animateSceneImage(imageUrl, prompt);
  if (jobId) await finishJob(jobId, result);

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });

  if (!isPrivileged) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { creditBalance: { decrement: VIDEO_GENERATION_CREDITS } },
    });
  }

  return NextResponse.json({ url: result.url, jobId, creditsCharged: isPrivileged ? 0 : VIDEO_GENERATION_CREDITS });
}
