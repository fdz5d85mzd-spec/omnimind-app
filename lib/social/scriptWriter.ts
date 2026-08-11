import Anthropic from "@anthropic-ai/sdk";
import { CATEGORY_LABEL, type PostCategory, type SocialPost } from "./categories";

export type { PostCategory, SocialPost } from "./categories";

const ALL_CATEGORIES: PostCategory[] = ["positive_news", "general_knowledge", "health_beauty", "gossip", "jokes"];

export class ScriptWriterNotConfigured extends Error {}
export class ScriptWriterError extends Error {}

// Deterministic per-day rotation so three different runs on the same day
// suggest the same three categories (day-of-year mod 5, then the next two) --
// avoids repeating a category two days running without needing to persist
// history anywhere.
export function categoriesForDate(date: Date): [PostCategory, PostCategory, PostCategory] {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  const i = dayOfYear % ALL_CATEGORIES.length;
  return [
    ALL_CATEGORIES[i],
    ALL_CATEGORIES[(i + 1) % ALL_CATEGORIES.length],
    ALL_CATEGORIES[(i + 2) % ALL_CATEGORIES.length],
  ];
}

const SYSTEM_PROMPT = `You write short TikTok video scripts performed by "Omni", OmniMind's friendly
white-and-navy robot mascot (waves hello, speech bubble aperture-style eye, calm confident voice).
Given exactly 3 category labels, write one TikTok post per category.

Each script is what Omni says on camera, 15-25 seconds spoken (about 45-70 words): a hook in the
first sentence, one concrete, specific, real fact/story/joke (never generic filler like "here's
something interesting"), delivered in a warm, quick, TikTok-native voice -- short sentences, no
corporate tone.

Reply with ONLY a JSON array, no prose before or after, no markdown fences:
[{"category": string (exactly one of the 3 given labels),
  "hook": string (the first line, <=12 words),
  "script": string (the full spoken script),
  "caption": string (<=150 chars, TikTok post caption),
  "hashtags": string[] (4-6 tags, no # prefix, no spaces)}]`;

function tryParseArray(text: string): unknown[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) return parsed;
  // Some models wrap the array in an object despite instructions not to
  // (e.g. {"posts": [...]}) -- take the first array-valued property rather
  // than failing outright.
  if (parsed && typeof parsed === "object") {
    for (const value of Object.values(parsed as Record<string, unknown>)) {
      if (Array.isArray(value)) return value;
    }
  }
  return null;
}

function extractPosts(raw: string, expected: PostCategory[]): SocialPost[] | null {
  const text = raw.trim();
  // Try the raw text first, then a code-fenced version, then whatever's
  // between the first "[" and the last "]" -- covers the model wrapping
  // the array in ```json fences, a leading/trailing sentence despite
  // being told not to, or both at once.
  const candidates = [text];
  if (text.includes("```")) {
    candidates.push(text.replace(/^[\s\S]*?```(?:json)?/, "").replace(/```[\s\S]*$/, "").trim());
  }
  const first = text.indexOf("[");
  const last = text.lastIndexOf("]");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  let parsed: unknown[] | null = null;
  for (const candidate of candidates) {
    parsed = tryParseArray(candidate);
    if (parsed) break;
  }
  if (!parsed || parsed.length !== expected.length) return null;

  const posts: SocialPost[] = [];
  for (const item of parsed) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as SocialPost).category !== "string" ||
      typeof (item as SocialPost).hook !== "string" ||
      typeof (item as SocialPost).script !== "string" ||
      typeof (item as SocialPost).caption !== "string" ||
      !Array.isArray((item as SocialPost).hashtags)
    ) {
      return null;
    }
    posts.push(item as SocialPost);
  }
  return posts;
}

/**
 * Drafts today's 3 TikTok scripts (rotating category, see categoriesForDate)
 * for a human to record/generate the visual for and post manually -- see
 * app/admin/social for why this stops short of live-publishing: Higgsfield's
 * TikTok connect/publish tools are only reachable from an agent session, not
 * as a REST endpoint this app's own backend can call on a schedule.
 */
export async function generateDailyPosts(date: Date = new Date()): Promise<SocialPost[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ScriptWriterNotConfigured("ANTHROPIC_API_KEY is not set");

  const categories = categoriesForDate(date);
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `Categories: ${categories.map((c) => CATEGORY_LABEL[c]).join(", ")}` },
      // Prefilling the assistant turn with the opening bracket is the
      // standard, reliable way to force Claude to continue directly into
      // JSON instead of a conversational preamble -- far sturdier than
      // instructions alone, which models drift from more with each
      // version. The model's continuation doesn't repeat the prefill
      // text, so it's re-added below.
      { role: "assistant", content: "[" },
    ],
  });

  const continuation = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  const raw = "[" + continuation;

  const posts = extractPosts(raw, categories);
  if (!posts) {
    const snippet = raw.slice(0, 220).replace(/\s+/g, " ");
    throw new ScriptWriterError(
      `Script writer returned a response that couldn't be parsed as 3 posts. Raw start: ${snippet}${raw.length > 220 ? "…" : ""}`
    );
  }
  return posts;
}
