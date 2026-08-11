import { NextResponse } from "next/server";
import { synthesizeVoice, VOICE_HELEN } from "@/lib/elevenlabs";

/**
 * Second phase of a creature reply: turns already-generated text into
 * speech. Split out from /api/creature-speak so the chat UI can show the
 * reply text the instant Claude answers, instead of waiting for ElevenLabs
 * synthesis too — voice then catches up a beat later.
 */
export async function POST(request: Request) {
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  const audio = await synthesizeVoice(text, VOICE_HELEN);
  return NextResponse.json({ audio });
}
