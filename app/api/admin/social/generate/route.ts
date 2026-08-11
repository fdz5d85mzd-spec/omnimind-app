import { NextResponse } from "next/server";
import { requireAdminOrMaster } from "@/lib/adminApi";
import { generateDailyPosts, ScriptWriterNotConfigured } from "@/lib/social/scriptWriter";

export async function POST() {
  const check = await requireAdminOrMaster();
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    const posts = await generateDailyPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    if (err instanceof ScriptWriterNotConfigured) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 501 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Generation failed" }, { status: 500 });
  }
}
