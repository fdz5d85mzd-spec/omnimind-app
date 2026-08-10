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

export type BlockedReason =
  | { reason: "cooldown"; retryAt: string }
  | { reason: "no_credits" };

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

// The Render free tier this API runs on spins the service down after ~15min
// idle, and the next request eats a 30-60s cold start. Retry through that
// window instead of failing on the first attempt.
const WAKE_RETRY_DELAYS_MS = [3000, 5000, 8000, 12000, 15000, 15000];

async function fetchWithWakeRetry(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
  onWaking?: () => void
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      if ((err as Error)?.name === "AbortError" || attempt >= WAKE_RETRY_DELAYS_MS.length) throw err;
      onWaking?.();
      await sleep(WAKE_RETRY_DELAYS_MS[attempt], signal);
    }
  }
}

export async function streamAgent(
  prompt: string,
  handlers: {
    onDelta: (text: string) => void;
    onDone: () => void;
    onError: (message: string) => void;
    onBlocked?: (info: BlockedReason) => void;
    onWaking?: () => void;
  },
  signal?: AbortSignal,
  // Signed-in users go through the server-side gated proxy (credits
  // enforced, can't be bypassed from the client); guests go straight to
  // the backend, exactly as before — nothing changes for them.
  gated = false
): Promise<void> {
  const url = gated ? "/api/chat/stream" : `${API_BASE}/agent/run/stream`;
  const body = gated ? { prompt } : { prompt, session_id: sessionId() };

  let res: Response;
  try {
    res = await fetchWithWakeRetry(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      },
      signal,
      handlers.onWaking
    );
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return;
    handlers.onError("Can't reach the OmniMind backend. It may be waking up — try again in a moment.");
    return;
  }

  if (res.status === 402) {
    const info = await res.json().catch(() => ({ reason: "no_credits" }));
    handlers.onBlocked?.(info);
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
