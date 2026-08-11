import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { animateSceneImage, isHiggsfieldConfigured } from "@/lib/voxstudio/higgsfield";
import { createJobIfOwned, finishJob } from "@/lib/voxstudio/jobs";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isHiggsfieldConfigured()) {
    return NextResponse.json({ error: "Video generation is not configured" }, { status: 501 });
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
  const session = await getServerSession(authOptions);
  if (session?.user?.id && body.projectId) {
    jobId = await createJobIfOwned(session.user.id, body.projectId, "video", {
      prompt,
      imageUrl,
      sceneIndex: body.sceneIndex ?? null,
    });
  }

  const result = await animateSceneImage(imageUrl, prompt);
  if (jobId) await finishJob(jobId, result);

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ url: result.url, jobId });
}
