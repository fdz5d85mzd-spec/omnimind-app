import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserWithRefill } from "@/lib/creditsServer";
import { IMAGE_GENERATION_CREDITS } from "@/lib/billing";
import { generateSceneImage, isHiggsfieldConfigured } from "@/lib/voxstudio/higgsfield";
import { createJobIfOwned, finishJob } from "@/lib/voxstudio/jobs";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isHiggsfieldConfigured()) {
    return NextResponse.json(
      { error: "temporarily_unavailable", message: "Image generation is temporarily unavailable." },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required to generate images" }, { status: 401 });
  }
  const user = await getUserWithRefill(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPrivileged = Boolean(session.user.isMaster || session.user.isAdmin);
  if (!isPrivileged && user.creditBalance < IMAGE_GENERATION_CREDITS) {
    return NextResponse.json(
      { error: "blocked", reason: "no_credits", need: IMAGE_GENERATION_CREDITS, have: user.creditBalance },
      { status: 402 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    projectId?: string;
    sceneIndex?: number;
  };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  if (prompt.length > 1000) return NextResponse.json({ error: "prompt is too long (max 1000 characters)" }, { status: 400 });

  let jobId: string | null = null;
  if (body.projectId) {
    jobId = await createJobIfOwned(session.user.id, body.projectId, "image", {
      prompt,
      sceneIndex: body.sceneIndex ?? null,
    });
  }

  const result = await generateSceneImage(prompt);
  if (jobId) await finishJob(jobId, result);

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });

  if (!isPrivileged) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { creditBalance: { decrement: IMAGE_GENERATION_CREDITS } },
    });
  }

  return NextResponse.json({ url: result.url, jobId, creditsCharged: isPrivileged ? 0 : IMAGE_GENERATION_CREDITS });
}
