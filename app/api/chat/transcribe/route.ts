import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Voice transcription is not configured" }, { status: 501 });
  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File) || file.size < 100) return NextResponse.json({ error: "No audio received" }, { status: 400 });
  const form = new FormData();
  form.set("file", file, file.name || "voice.webm");
  form.set("model_id", "scribe_v2");
  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: "Could not transcribe audio" }, { status: 502 });
  return NextResponse.json({ text: typeof result.text === "string" ? result.text.trim() : "" });
}
