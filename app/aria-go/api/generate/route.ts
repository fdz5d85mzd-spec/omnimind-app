import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserWithRefill } from "@/lib/creditsServer";
import { IMAGE_GENERATION_CREDITS } from "@/lib/billing";
import { generateAvatarImage, isHiggsfieldConfigured } from "@/lib/ariago/higgsfield";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isHiggsfieldConfigured()) {
    return NextResponse.json(
      { error: "temporarily_unavailable", message: "Avatar generation is temporarily unavailable." },
      { status: 503 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required to create an avatar" }, { status: 401 });
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

  const body = (await request.json().catch(() => ({}))) as { description?: string };
  const description = (body.description ?? "").trim();
  if (!description) return NextResponse.json({ error: "description is required" }, { status: 400 });
  if (description.length > 500) {
    return NextResponse.json({ error: "description is too long (max 500 characters)" }, { status: 400 });
  }

  const result = await generateAvatarImage(description);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 502 });

  if (!isPrivileged) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { creditBalance: { decrement: IMAGE_GENERATION_CREDITS } },
    });
  }

  return NextResponse.json({ url: result.url, creditsCharged: isPrivileged ? 0 : IMAGE_GENERATION_CREDITS });
}
