import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signR2Parts } from "@/lib/orpheus/_r2.js";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "");
  const parts = Array.isArray(body.parts) ? body.parts.map(Number) : [];
  if (!key.includes(`/${userId}/`) || !body.uploadId || !parts.length || parts.length > 100 || parts.some((part: number) => !Number.isInteger(part) || part < 1)) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  return NextResponse.json({ parts: await signR2Parts(key, String(body.uploadId), parts) });
}
