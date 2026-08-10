import Anthropic from "@anthropic-ai/sdk";

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
never generic filler like "the story unfolds".

Reply with ONLY a JSON object, no prose before or after it, no markdown fences:
{"title": string, "logline": string,
 "characters": [{"name": string, "description": string}],
 "scenes": [{"heading": string, "description": string,
             "shots": [{"camera": string, "action": string}]}]}`;

function extractBrief(raw: string): CreativeBrief | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?/, "").replace(/```$/, "").trim();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as CreativeBrief).title === "string" &&
    typeof (parsed as CreativeBrief).logline === "string" &&
    Array.isArray((parsed as CreativeBrief).scenes) &&
    Array.isArray((parsed as CreativeBrief).characters)
  ) {
    return parsed as CreativeBrief;
  }
  return null;
}

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
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: idea }],
  });

  const raw = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const brief = extractBrief(raw);
  if (!brief) throw new DirectorError("Director Agent returned a response that couldn't be parsed as a brief");
  return brief;
}
