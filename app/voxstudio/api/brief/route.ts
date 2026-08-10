import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DirectorError, DirectorNotConfigured, generateCreativeBrief } from "@/lib/voxstudio/director";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { idea?: string };
  const idea = (body.idea ?? "").trim();
  if (!idea) {
    return NextResponse.json({ error: "idea is required" }, { status: 400 });
  }
  if (idea.length > 500) {
    return NextResponse.json({ error: "idea is too long (max 500 characters)" }, { status: 400 });
  }

  let brief;
  try {
    brief = await generateCreativeBrief(idea);
  } catch (err) {
    if (err instanceof DirectorNotConfigured) {
      return NextResponse.json({ error: "Director Agent is not configured" }, { status: 501 });
    }
    const message = err instanceof DirectorError ? err.message : "Director Agent call failed";
    console.error("voxstudio brief generation failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Persistence is best-effort and requires sign-in: DATABASE_URL may not be
  // configured yet, and a guest brief is still fully usable without it.
  let projectId: string | null = null;
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    try {
      const project = await prisma.voxProject.create({
        data: {
          userId: session.user.id,
          idea,
          title: brief.title,
          logline: brief.logline,
          characters: {
            create: brief.characters.map((c) => ({ name: c.name, description: c.description })),
          },
          scenes: {
            create: brief.scenes.map((s, i) => ({
              order: i,
              heading: s.heading,
              description: s.description,
              shots: s.shots,
            })),
          },
        },
      });
      projectId = project.id;
    } catch (err) {
      console.error("voxstudio project persistence failed:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({
    brief,
    projectId,
    persisted: projectId !== null,
    signedIn: Boolean(session?.user?.id),
  });
}
