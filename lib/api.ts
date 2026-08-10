export const API_BASE =
  process.env.NEXT_PUBLIC_OMNIMIND_API?.replace(/\/$/, "") || "https://origox.xyz";

export const WS_BASE = API_BASE.replace(/^http/, "ws");

export function sessionId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "omnimind_session_id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; run_id: string; answer: string; duration_ms: number }
  | { type: "failed" | "denied"; run_id: string; error: string };

export async function streamAgent(
  prompt: string,
  handlers: {
    onDelta: (text: string) => void;
    onDone: () => void;
    onError: (message: string) => void;
  },
  signal?: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/agent/run/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, session_id: sessionId() }),
      signal,
    });
  } catch {
    handlers.onError("Can't reach the OmniMind backend. It may be waking up — try again in a moment.");
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError(`Backend returned ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";

    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      let evt: StreamEvent;
      try {
        evt = JSON.parse(jsonStr);
      } catch {
        continue;
      }
      if (evt.type === "delta") handlers.onDelta(evt.text);
      else if (evt.type === "done") handlers.onDone();
      else if (evt.type === "failed" || evt.type === "denied") handlers.onError(evt.error);
    }
  }
}
