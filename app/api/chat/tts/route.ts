import { NextResponse } from "next/server";
import { synthesizeVoice, VOICE_OMNIMIND } from "@/lib/elevenlabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Turns an already-streamed assistant reply into speech, same split-phase
 * pattern as Helen's /helen/api/tts: the chat UI shows the text the instant
 * the stream finishes, then this catches up a beat later with audio.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  const audio = await synthesizeVoice(text.trim().slice(0, 2200), VOICE_OMNIMIND);
  return NextResponse.json({ audio });
}
