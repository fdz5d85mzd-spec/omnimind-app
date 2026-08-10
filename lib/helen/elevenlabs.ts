/**
 * Renders text as an actual MP3 (base64) via ElevenLabs, server-side. This
 * exists because client-side speechSynthesis is unreliable on mobile Safari
 * (silently blocked unless primed inside the exact user gesture) — a real
 * audio file played through <audio> sidesteps that entirely, the same way
 * our background music already works. Returns null (no audio) if
 * ELEVENLABS_API_KEY isn't set or the call fails — never throws, so a
 * missing/broken TTS key never breaks the chat itself.
 */
export async function synthesizeVoice(text: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  // "Bella" — a stock ElevenLabs voice, warm and soft; swap the ID for any
  // other voice from the user's ElevenLabs voice library if they'd prefer.
  const voiceId = "EXAVITQu4vr4xnSDxMaL";
  try {
    // optimize_streaming_latency trades a little audio quality for real
    // generation-time speed even on this non-streaming endpoint — worth it
    // for a voice reply the owner is actively waiting on.
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          // Slightly higher stability + speaker boost reduces the
          // warble/mispronunciation that "Bella" (an English-tuned voice)
          // is more prone to on non-English text like Greek.
          voice_settings: { stability: 0.65, similarity_boost: 0.8, use_speaker_boost: true },
        }),
      },
    );
    if (!res.ok) {
      console.error("ElevenLabs TTS failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString("base64");
  } catch (err) {
    console.error("ElevenLabs TTS error:", err instanceof Error ? err.message : err);
    return null;
  }
}
