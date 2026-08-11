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

function tryParseObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function extractBrief(raw: string): CreativeBrief | null {
  const text = raw.trim();
  // Try the raw text, a code-fenced version, and whatever's between the
  // first "{" and the last "}" -- covers the model adding ```json fences
  // or a leading/trailing sentence despite being told not to.
  const candidates = [text];
  if (text.includes("```")) {
    candidates.push(text.replace(/^[\s\S]*?```(?:json)?/, "").replace(/```[\s\S]*$/, "").trim());
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));

  let parsed: Record<string, unknown> | null = null;
  for (const candidate of candidates) {
    parsed = tryParseObject(candidate);
    if (parsed) break;
  }
  if (
    parsed &&
    typeof parsed.title === "string" &&
    typeof parsed.logline === "string" &&
    Array.isArray(parsed.scenes) &&
    Array.isArray(parsed.characters)
  ) {
    return parsed as unknown as CreativeBrief;
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
    messages: [
      { role: "user", content: idea },
      // Forces the continuation straight into JSON instead of a
      // conversational preamble -- sturdier than instructions alone.
      // The model's continuation doesn't repeat this prefill text, so
      // it's re-added below.
      { role: "assistant", content: "{" },
    ],
  });

  const continuation = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  const raw = "{" + continuation;

  const brief = extractBrief(raw);
  if (!brief) {
    const snippet = raw.slice(0, 220).replace(/\s+/g, " ");
    throw new DirectorError(
      `Director Agent returned a response that couldn't be parsed as a brief. Raw start: ${snippet}${raw.length > 220 ? "…" : ""}`
    );
  }
  return brief;
}
