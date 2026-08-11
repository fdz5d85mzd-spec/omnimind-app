import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";

export interface CreativeBrief {
  title: string;
  logline: string;
  characters: { name: string; description: string }[];
  scenes: { heading: string; description: string; shots: { camera: string; action: string }[] }[];
}

export class DirectorNotConfigured extends Error {}
export class DirectorError extends Error {}

const SYSTEM_PROMPT = `You are the Director Agent of VoxStudio, OmniMind's AI film pre-production tool.
Given a one-line idea, produce a concrete creative brief for a SHORT piece (under 2 minutes runtime):
a title, a one-sentence logline, 2-4 characters, and 2-4 scenes each broken into 2-4 shots
(camera + action per shot). Be specific and concrete -- name real camera moves and real actions,
never generic filler like "the story unfolds".`;

// Constrains the model's response server-side via output_config.format
// (see lib/social/scriptWriter.ts for the same pattern) -- claude-sonnet-5
// and the rest of the current model family reject the older "assistant
// message prefill" trick (400 invalid_request_error), so this is the
// supported way to force valid, schema-matching JSON.
const CreativeBriefSchema = z.object({
  title: z.string(),
  logline: z.string(),
  characters: z.array(z.object({ name: z.string(), description: z.string() })).min(2).max(4),
  scenes: z
    .array(
      z.object({
        heading: z.string(),
        description: z.string(),
        shots: z.array(z.object({ camera: z.string(), action: z.string() })).min(2).max(4),
      })
    )
    .min(2)
    .max(4),
});

/**
 * Generates a structured creative brief from a one-line idea. Runs on the
 * same ANTHROPIC_API_KEY already configured for the rest of OmniMind's chat
 * and Helen's creature-speak -- no new provider key needed for this step.
 * Throws DirectorNotConfigured if the key is missing, DirectorError if the
 * model's response can't be parsed into a brief.
 */
export async function generateCreativeBrief(idea: string): Promise<CreativeBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new DirectorNotConfigured("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const format = zodOutputFormat(CreativeBriefSchema);

  // 4096 (up from an earlier 1500) -- up to 4 characters plus 4 scenes of
  // 4 shots each, as JSON, occasionally ran past 1500 and got cut off
  // mid-string, which surfaced as a confusing "invalid JSON" error instead
  // of the truncation it actually was. Checking stop_reason below catches
  // it either way.
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    output_config: { format },
    messages: [{ role: "user", content: idea }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (response.stop_reason === "max_tokens") {
    throw new DirectorError(
      `Director Agent's response was cut off before finishing (hit the ${4096}-token limit). Raw start: ${text.slice(0, 220)}…`
    );
  }

  try {
    return format.parse(text);
  } catch (err) {
    throw new DirectorError(
      `Director Agent returned a response that couldn't be parsed as a brief. ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
