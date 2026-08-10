"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE, wsUrl, sessionId, runAgent, type AgentRunResponse } from "@/lib/api";

const STAGE_LABEL: Record<string, string> = {
  started: "Request received",
  policy_evaluated: "Policy check passed",
  memory_stored: "Saved to memory",
  task_assigned: "Agent assigned",
  thinking: "Thinking…",
  completed: "Done",
  failed: "Failed",
  denied: "Denied",
};

const SUGGESTIONS = [
  "Explain how a leader election algorithm works",
  "Draft a launch announcement for an AI operating system",
  "Plan a 3-step rollout for a new feature",
  "Summarize the tradeoffs of microservices vs a monolith",
];

type Step = { stage: string; at: number };
type Phase = "landing" | "working" | "done";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("landing");
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "live" | "down">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const sid = useRef<string>("");

  useEffect(() => {
    sid.current = sessionId();
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(wsUrl("/twin/stream"));
      wsRef.current = ws;
      ws.onopen = () => setWsStatus("live");
      ws.onclose = () => {
        setWsStatus("down");
        if (!cancelled) setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.type !== "fleet_event") return;
        if (typeof msg.subject !== "string" || !msg.subject.startsWith("agent.")) return;
        if (msg.payload?.session_id !== sid.current) return;
        const parts = msg.subject.split(".");
        const stage = parts[parts.length - 1];
        setSteps((prev) => [...prev, { stage, at: Date.now() }]);
      };
    }

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  async function submit(text?: string) {
    const q = (text ?? prompt).trim();
    if (!q) return;
    setPrompt(q);
    setSteps([]);
    setResult(null);
    setPhase("working");
    try {
      const res = await runAgent(q);
      setResult(res);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      setResult({
        run_id: "",
        status: "failed",
        prompt: q,
        answer: null,
        error: message,
        task_id: null,
        duration_ms: 0,
      });
    }
    setPhase("done");
  }

  function reset() {
    setPhase("landing");
    setPrompt("");
    setSteps([]);
    setResult(null);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="font-head text-lg tracking-wide">OMNIMIND</span>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span
            className={`h-2 w-2 rounded-full ${
              wsStatus === "live" ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-red-400"
            }`}
          />
          {wsStatus === "live" ? "live" : wsStatus === "connecting" ? "connecting…" : "reconnecting…"}
        </div>
      </header>

      {phase === "landing" && (
        <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-cyan text-xs font-bold tracking-[0.2em] mb-4">THE AUTONOMOUS AI OPERATING SYSTEM</p>
          <h1 className="font-head text-4xl sm:text-5xl font-bold mb-4">Ask anything.</h1>
          <p className="text-muted max-w-xl mb-10">
            Type a request. A real OmniMind agent — policy-checked, orchestrated, remembered — goes to work and
            answers.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="w-full max-w-2xl"
          >
            <div className="flex items-center gap-2 bg-card border border-card2 rounded-2xl px-5 py-4 focus-within:border-accent transition-colors">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask OmniMind to explain, draft, plan, or research anything…"
                className="flex-1 bg-transparent outline-none placeholder:text-mutedDark text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity text-white text-sm font-bold px-5 py-2 rounded-xl"
              >
                Ask
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="text-xs text-muted bg-card hover:bg-card2 border border-card2 rounded-full px-4 py-2 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {phase !== "landing" && (
        <section className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
          <div className="bg-card border border-card2 rounded-2xl px-6 py-5 mb-6">
            <p className="text-xs text-mutedDark mb-1">You asked</p>
            <p className="text-base">{prompt}</p>
          </div>

          <div className="bg-card border border-card2 rounded-2xl px-6 py-5 mb-6">
            <p className="text-xs text-mutedDark mb-4">Agent activity</p>
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                  <span className="text-white">{STAGE_LABEL[s.stage] || s.stage}</span>
                </li>
              ))}
              {phase === "working" && (
                <li className="flex items-center gap-3 text-sm text-mutedDark">
                  <span className="h-1.5 w-1.5 rounded-full bg-mutedDark animate-pulse" />
                  working…
                </li>
              )}
            </ol>
          </div>

          {phase === "done" && result && (
            <div className="bg-card border border-card2 rounded-2xl px-6 py-5">
              {result.status === "completed" ? (
                <>
                  <p className="text-xs text-cyan mb-3">Answer</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{result.answer}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-red-400 mb-3">
                    {result.status === "denied" ? "Denied by policy" : "Couldn't complete this request"}
                  </p>
                  <p className="text-sm text-muted">{result.error}</p>
                  {result.error?.includes("API_KEY") && (
                    <p className="text-xs text-mutedDark mt-3">
                      The backend has no LLM key configured yet — set OPENAI_API_KEY or ANTHROPIC_API_KEY on the
                      OmniMind service.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {phase === "done" && (
            <button
              onClick={reset}
              className="mt-6 text-sm text-muted hover:text-white border border-card2 rounded-xl px-4 py-2 transition-colors"
            >
              Ask something else
            </button>
          )}
        </section>
      )}

      <footer className="text-center text-xs text-mutedDark py-6">
        Powered by the OmniMind control plane — {API_BASE.replace(/^https?:\/\//, "")}
      </footer>
    </main>
  );
}
