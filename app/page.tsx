"use client";

import { useEffect, useRef, useState } from "react";
import { streamAgent } from "@/lib/api";

const SUGGESTIONS = [
  "Explain how a leader election algorithm works",
  "Draft a launch announcement for an AI operating system",
  "Plan a 3-step rollout for a new feature",
  "Summarize the tradeoffs of microservices vs a monolith",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "done" | "error";
};

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || isStreaming) return;

    const userMsg: Message = { id: newId(), role: "user", content: q, status: "done" };
    const assistantId = newId();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", status: "streaming" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);
    requestAnimationFrame(autoGrow);

    const controller = new AbortController();
    abortRef.current = controller;

    function updateAssistant(patch: Partial<Message>) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));
    }

    await streamAgent(
      q,
      {
        onDelta: (text) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m))
          );
        },
        onDone: () => updateAssistant({ status: "done" }),
        onError: (message) => updateAssistant({ content: message, status: "error" }),
      },
      controller.signal
    );

    setIsStreaming(false);
  }

  function stop() {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.status === "streaming" ? { ...m, status: "done" } : m))
    );
  }

  function newChat() {
    if (isStreaming) stop();
    setMessages([]);
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-card2/60">
        <span className="font-head text-base tracking-wide">OMNIMIND</span>
        {!empty && (
          <button
            onClick={newChat}
            className="text-xs text-muted hover:text-white border border-card2 rounded-lg px-3 py-1.5 transition-colors"
          >
            New chat
          </button>
        )}
      </header>

      {empty ? (
        <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-cyan text-xs font-bold tracking-[0.2em] mb-4">THE AUTONOMOUS AI OPERATING SYSTEM</p>
          <h1 className="font-head text-4xl sm:text-5xl font-bold mb-4">Ask anything.</h1>
          <p className="text-muted max-w-xl mb-10">
            A real OmniMind agent — policy-checked, orchestrated, remembered — goes to work and answers.
          </p>

          <Composer
            value={input}
            onChange={(v) => {
              setInput(v);
              autoGrow();
            }}
            onSubmit={() => send()}
            disabled={isStreaming}
            textareaRef={textareaRef}
            autoFocus
          />

          <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs text-muted bg-card hover:bg-card2 border border-card2 rounded-full px-4 py-2 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="flex-1 overflow-y-auto px-4 sm:px-0">
            <div className="max-w-3xl mx-auto w-full py-8 space-y-6">
              {messages.map((m) => (
                <MessageRow key={m.id} message={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          </section>

          <div className="border-t border-card2/60 bg-bg/95 backdrop-blur px-4 sm:px-0 py-4">
            <div className="max-w-3xl mx-auto w-full">
              <Composer
                value={input}
                onChange={(v) => {
                  setInput(v);
                  autoGrow();
                }}
                onSubmit={() => send()}
                disabled={isStreaming}
                textareaRef={textareaRef}
                streaming={isStreaming}
                onStop={stop}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function MessageRow({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-accent/90 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm sm:text-base whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="h-7 w-7 shrink-0 rounded-full bg-card2 flex items-center justify-center mt-0.5">
        <span className="h-2 w-2 rounded-full bg-cyan" />
      </div>
      <div
        className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-0.5 ${
          message.status === "error" ? "text-red-400" : "text-white"
        }`}
      >
        {message.content || (message.status === "streaming" ? <TypingDots /> : null)}
        {message.status === "streaming" && message.content && (
          <span className="inline-block w-1.5 h-4 bg-cyan/80 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-mutedDark animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-mutedDark animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-mutedDark animate-bounce" />
    </span>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  textareaRef,
  autoFocus,
  streaming,
  onStop,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  autoFocus?: boolean;
  streaming?: boolean;
  onStop?: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex items-end gap-2 bg-card border border-card2 rounded-2xl px-4 py-3 focus-within:border-accent transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          autoFocus={autoFocus}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Ask OmniMind to explain, draft, plan, or research anything…"
          className="flex-1 bg-transparent outline-none resize-none placeholder:text-mutedDark text-sm sm:text-base py-1 max-h-[200px]"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 bg-card2 hover:bg-mutedDark/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="shrink-0 bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity text-white text-sm font-bold px-5 py-2 rounded-xl"
          >
            Ask
          </button>
        )}
      </div>
    </form>
  );
}
