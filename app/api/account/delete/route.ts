import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Google Play's Data safety section requires a working, self-serve account
// deletion path -- this is that path. All of User's relations are
// onDelete: Cascade in schema.prisma, so deleting the row removes every
// associated record (sessions, connections, usage events, VoxStudio
// projects) in one statement.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
