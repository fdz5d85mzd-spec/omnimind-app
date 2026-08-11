/**
 * Renders text as an actual MP3 (base64) via ElevenLabs, server-side. This
 * exists because client-side speechSynthesis is unreliable on mobile Safari
 * (silently blocked unless primed inside the exact user gesture) — a real
 * audio file played through <audio> sidesteps that entirely, the same way
 * Helen's background music already works. Returns null (no audio) if
 * ELEVENLABS_API_KEY isn't set or the call fails — never throws, so a
 * missing/broken TTS key never breaks the chat itself.
 */
export async function synthesizeVoice(text: string, voiceId = "EXAVITQu4vr4xnSDxMaL"): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

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
          // warble/mispronunciation stock voices are more prone to on
          // non-English text like Greek.
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

// Stock ElevenLabs voice IDs, stable across accounts since they're
// pre-made/default voices, not anything specific to this project's library.
export const VOICE_HELEN = "EXAVITQu4vr4xnSDxMaL"; // "Bella" -- warm, soft, matches Helen's creature persona
export const VOICE_OMNIMIND = "pNInz6obpgDQGcFmaJgB"; // "Adam" -- even, confident, matches an OS/agent persona
