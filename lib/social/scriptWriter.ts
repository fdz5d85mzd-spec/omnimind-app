import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
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

Write one post per given category, in the order the categories are given.`;

// Constrains the model's response server-side via output_config.format
// (see lib/voxstudio/director.ts for the same pattern) -- claude-sonnet-5
// and the rest of the current model family reject the older "assistant
// message prefill" trick (400 invalid_request_error), so this is the
// supported way to force valid, schema-matching JSON.
const PostSchema = z.object({
  category: z.enum(ALL_CATEGORIES as [PostCategory, ...PostCategory[]]),
  hook: z.string(),
  script: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

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
  const format = zodOutputFormat(z.array(PostSchema).length(categories.length));

  // 4096 (up from an earlier 1500) -- 3 full scripts plus JSON structure
  // occasionally ran past 1500 and got cut off mid-string, which surfaced
  // as a confusing "invalid JSON" error instead of the truncation it
  // actually was. Checking stop_reason below catches it either way.
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    output_config: { format },
    messages: [
      { role: "user", content: `Categories: ${categories.map((c) => CATEGORY_LABEL[c]).join(", ")}` },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (response.stop_reason === "max_tokens") {
    throw new ScriptWriterError(
      `Script writer's response was cut off before finishing (hit the ${4096}-token limit). Raw start: ${text.slice(0, 220)}…`
    );
  }

  try {
    return format.parse(text) as SocialPost[];
  } catch (err) {
    throw new ScriptWriterError(
      `Script writer returned a response that couldn't be parsed as ${categories.length} posts. ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
