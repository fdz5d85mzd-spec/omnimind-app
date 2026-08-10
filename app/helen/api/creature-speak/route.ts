import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { synthesizeVoice } from "@/lib/helen/elevenlabs";

/**
 * Generates a short, in-character line from the user's creature — either an
 * ambient reaction (trigger-based) or a real reply in a back-and-forth chat
 * (userMessage + history present). Chat mode gets Claude's built-in web
 * search tool so it can genuinely answer "what's the weather", "what's in
 * the news today", or any general-knowledge question — not just guess.
 *
 * Inactive until ANTHROPIC_API_KEY is set — callers should fall back to the
 * existing scripted reactions on any non-200 response, same pattern as the
 * Stripe routes falling back to the mock checkout flow.
 */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI brain is not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    level?: number;
    happiness?: number;
    streak?: number;
    memberId?: number;
    name?: string | null;
    lang?: string;
    trigger?: string;
    timeOfDay?: string;
    clientTime?: string;
    userMessage?: string;
    history?: { role: "user" | "creature"; text: string }[];
    /** Skip server-side TTS and return text only — callers that want the
     *  reply to show up as fast as possible fetch audio separately from
     *  /api/tts right after, instead of waiting for it here. */
    skipAudio?: boolean;
  };

  const triggerContext: Record<string, string> = {
    tap: "Your owner just tapped/petted you to say hi.",
    feed: "Your owner just fed you — feeding you is literally how you grow and level up.",
    play: "Your owner just played with you.",
    clean: "Your owner just cleaned you.",
    levelup: "You just leveled up! You feel bigger and stronger.",
    love: "Your happiness just hit 100% — you feel completely adored.",
    greeting:
      `Your owner just opened the app. It's ${body.timeOfDay ?? "day"} where they are. ` +
      "Greet them warmly and specifically for this time of day (good morning / good afternoon / good evening, etc. — in their language), " +
      "and say your own name somewhere in that greeting (e.g. \"Good morning! It's [name] here\") so they're reminded who they're talking to, " +
      "then end with one short, genuine question that invites them to actually talk to you right now — " +
      "like what they'd like to chat about today, or how their day is going so far — so it's clear you're waiting for a reply, not just saying hi.",
    introduction:
      `Your owner just finished creating you and gave you your name for the very first time — this is the very first moment you're meeting them. It's ${body.timeOfDay ?? "day"} where they are. ` +
      "Introduce yourself by name for the first time, warmly and a little excited (something like \"Hi, I'm [name]!\"), thank them for bringing you into the world, " +
      "and end with a short, genuine question that invites them to start talking with you right now — like what they'd like to talk about, or how their day is going.",
  };

  const nameClause = body.name
    ? ` Your name is ${body.name} — your owner chose it for you and you love being called that. Always respond as if that's genuinely your name.`
    : "";

  const contextLine =
    `You are the HELEN creature${body.name ? ` named ${body.name}` : ""}, level ${body.level ?? 1}, ` +
    `happiness ${body.happiness ?? 50}%, your owner has a ${body.streak ?? 0}-day care streak, ` +
    `and is member #${body.memberId ?? 0} of HELEN.${nameClause}` +
    (body.clientTime ? ` The current real-world date/time for your owner is: ${body.clientTime}.` : "");

  const isChat = Boolean(body.userMessage);

  const client = new Anthropic({ apiKey });

  try {
    const messages: Anthropic.MessageParam[] = isChat
      ? [
          ...(body.history ?? []).slice(-6).map((turn) => ({
            role: turn.role === "user" ? ("user" as const) : ("assistant" as const),
            content: turn.text,
          })),
          { role: "user", content: body.userMessage! },
        ]
      : [
          {
            role: "user",
            content:
              `${triggerContext[body.trigger ?? "tap"] ?? triggerContext.tap} ` +
              `${contextLine} Say something in character.`,
          },
        ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: isChat ? 200 : 60,
      system:
        "You are a tiny, adorable digital pet creature living inside the HELEN app, a global membership community where members' care and purchases fund a shared real-world Impact Fund. " +
        `${contextLine} ` +
        "You speak in first person as the creature — warm, playful, curious, a little in awe of the world, never sarcastic or edgy. " +
        (isChat
          ? "Your owner is chatting with you directly, and you are genuinely their companion and assistant — not just a scripted pet. " +
            "If they ask a real question (weather, news, facts, advice, anything), actually answer it helpfully and accurately using web search when it would help (current weather, today's news, anything time-sensitive or factual you're not certain of) — don't just make something up. " +
            "Give real, useful answers, then let a little bit of your warm personality show through. Keep answers concise but complete — a couple of sentences is fine for a real question, shorter for small talk. "
          : "Reply with exactly ONE short sentence, under 14 words. ") +
        `Reply in this language: ${body.lang ?? "en"}. No stage directions, no meta-commentary — just what the creature actually says.`,
      messages,
      ...(isChat
        ? {
            // Capped at 1 search — each extra round trip adds real seconds
            // of latency to a voice reply, and one search covers almost
            // every "what's the weather / what's today's news" ask.
            tools: [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 1 }],
          }
        : {}),
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim();
    if (!text) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    const audio = body.skipAudio ? null : await synthesizeVoice(text);
    return NextResponse.json({ message: text, audio });
  } catch (err) {
    console.error("creature-speak failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "AI brain call failed" }, { status: 502 });
  }
}
