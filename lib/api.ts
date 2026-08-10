export const API_BASE =
  process.env.NEXT_PUBLIC_OMNIMIND_API?.replace(/\/$/, "") || "https://origox.xyz";

export function wsUrl(path: string): string {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}${path}`;
}

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

export type AgentRunResponse = {
  run_id: string;
  status: "completed" | "failed" | "denied";
  prompt: string;
  answer: string | null;
  error: string | null;
  task_id: string | null;
  duration_ms: number;
};

export async function runAgent(prompt: string): Promise<AgentRunResponse> {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, session_id: sessionId() }),
  });
  if (!res.ok) {
    throw new Error(`OmniMind backend returned ${res.status}`);
  }
  return res.json();
}
