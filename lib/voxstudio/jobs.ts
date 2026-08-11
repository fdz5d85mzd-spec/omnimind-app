import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Only bookkeeps a job row when the project is real and owned by this user -- generation itself never depends on it. */
export async function createJobIfOwned(
  userId: string,
  projectId: string,
  kind: "image" | "video",
  input: Record<string, unknown>,
): Promise<string | null> {
  try {
    const project = await prisma.voxProject.findFirst({ where: { id: projectId, userId } });
    if (!project) return null;
    const job = await prisma.voxJob.create({
      data: { projectId, kind, status: "running", input: input as Prisma.InputJsonValue },
    });
    return job.id;
  } catch {
    return null;
  }
}

export async function finishJob(jobId: string, result: { url: string } | { error: string }): Promise<void> {
  await prisma.voxJob
    .update({
      where: { id: jobId },
      data: "url" in result ? { status: "completed", output: { url: result.url } } : { status: "failed", error: result.error },
    })
    .catch(() => {});
}
