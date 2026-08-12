import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Shot = { camera: string; action: string };

/**
 * Loads one saved VoxStudio project back into the same shape the brief
 * endpoint returns, plus any images/videos already generated for its
 * scenes -- reconstructed from completed VoxJob rows (job.input.sceneIndex
 * says which scene, job.kind says image vs video) rather than a separate
 * join table, since a job's own record is already the source of truth for
 * what got generated.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const project = await prisma.voxProject.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      characters: { orderBy: { createdAt: "asc" } },
      scenes: { orderBy: { order: "asc" } },
      jobs: { where: { status: "completed" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const media: Record<number, { imageUrl?: string; videoUrl?: string }> = {};
  for (const job of project.jobs) {
    const input = job.input as { sceneIndex?: number } | null;
    const output = job.output as { url?: string } | null;
    if (input?.sceneIndex == null || !output?.url) continue;
    if (!media[input.sceneIndex]) media[input.sceneIndex] = {};
    if (job.kind === "image") media[input.sceneIndex].imageUrl = output.url;
    if (job.kind === "video") media[input.sceneIndex].videoUrl = output.url;
  }

  return NextResponse.json({
    projectId: project.id,
    persisted: true,
    signedIn: true,
    brief: {
      title: project.title,
      logline: project.logline,
      characters: project.characters.map((c) => ({ name: c.name, description: c.description })),
      scenes: project.scenes.map((s) => ({
        heading: s.heading,
        description: s.description,
        shots: (s.shots as Shot[] | null) ?? [],
      })),
    },
    media,
  });
}
