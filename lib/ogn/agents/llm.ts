// ─── LLM Abstraction Layer (reused from Gladi pattern) ────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

type LLMProvider = "openai" | "anthropic";

function getProvider(): LLMProvider {
  if (/^sk-ant-[A-Za-z0-9_-]{40,}$/.test(process.env.ANTHROPIC_API_KEY || ""))
    return "anthropic";
  if (/^sk-[A-Za-z0-9_-]{20,}$/.test(process.env.OPENAI_API_KEY || ""))
    return "openai";
  throw new Error(
    "No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
  );
}

export async function callLLM(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number; json?: boolean },
): Promise<LLMResponse> {
  const provider = getProvider();
  if (provider === "openai") return callOpenAI(messages, options);
  return callAnthropic(messages, options);
}

async function callOpenAI(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number; json?: boolean },
): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const body: any = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4000,
  };
  if (options?.json) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }
  const data = await res.json();
  return {
    content: data.choices[0]?.message?.content || "",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
    },
  };
}

async function callAnthropic(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number; json?: boolean },
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");
  const body: any = {
    model,
    max_tokens: options?.maxTokens ?? 4000,
    messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemMsg) body.system = systemMsg.content;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${err}`);
  }
  const data = await res.json();
  let content = data.content?.map((c: any) => c.text).join("") || "";
  if (options?.json) {
    const match =
      content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    if (match) content = match[1] || match[0];
  }
  return {
    content,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
    },
  };
}
