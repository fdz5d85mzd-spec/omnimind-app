"use client";

import { useEffect, useRef, useState } from "react";
import { streamAgent } from "@/lib/api";
import {
  type ChatMessage,
  type Conversation,
  deriveTitle,
  loadConversations,
  newId,
  saveConversations,
} from "@/lib/conversations";
import Sidebar from "@/components/Sidebar";
import { Logo, LogoMark } from "@/components/Logo";

const SUGGESTIONS = [
  "Explain how a leader election algorithm works",
  "Draft a launch announcement for an AI operating system",
  "Plan a 3-step rollout for a new feature",
  "Summarize the tradeoffs of microservices vs a monolith",
];

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setConversations(loadConversations());
    setSidebarCollapsed(window.innerWidth < 1024);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  const active = conversations.find((c) => c.id === activeId) || null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  function updateConversation(id: string, updater: (c: Conversation) => Conversation) {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || isStreaming) return;

    let convoId = activeId;
    const userMsg: ChatMessage = { id: newId(), role: "user", content: q, status: "done" };
    const assistantId = newId();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", status: "streaming" };

    if (!convoId) {
      convoId = newId();
      const convo: Conversation = {
        id: convoId,
        title: deriveTitle(q),
        messages: [userMsg, assistantMsg],
        updatedAt: Date.now(),
      };
      setConversations((prev) => [convo, ...prev]);
      setActiveId(convoId);
    } else {
      updateConversation(convoId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg, assistantMsg],
        updatedAt: Date.now(),
      }));
    }

    setInput("");
    setIsStreaming(true);
    requestAnimationFrame(autoGrow);

    const controller = new AbortController();
    abortRef.current = controller;
    const id = convoId;

    function patchAssistant(patch: Partial<ChatMessage>) {
      updateConversation(id!, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
      }));
    }

    await streamAgent(
      q,
      {
        onDelta: (text) => {
          updateConversation(id!, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m)),
          }));
        },
        onDone: () => patchAssistant({ status: "done" }),
        onError: (message) => patchAssistant({ content: message, status: "error" }),
      },
      controller.signal
    );

    setIsStreaming(false);
  }

  function stop() {
    abortRef.current?.abort();
    setIsStreaming(false);
    if (activeId) {
      updateConversation(activeId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.status === "streaming" ? { ...m, status: "done" } : m)),
      }));
    }
  }

  function newChat() {
    if (isStreaming) stop();
    setActiveId(null);
    setInput("");
    if (window.innerWidth < 1024) setSidebarCollapsed(true);
  }

  function selectConversation(id: string) {
    if (isStreaming) stop();
    setActiveId(id);
    if (window.innerWidth < 1024) setSidebarCollapsed(true);
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newChat}
        collapsed={sidebarCollapsed}
        onCloseMobile={() => setSidebarCollapsed(true)}
      />
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="flex items-center gap-3 px-4 py-3 lg:hidden border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl z-10">
          <button onClick={() => setSidebarCollapsed(false)} className="text-muted hover:text-white p-1 -ml-1 transition-colors">
            <MenuIcon />
          </button>
          <Logo size={18} />
        </header>

        {empty ? (
          <section className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
            <div className="relative animate-fadeIn">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center">
                <LogoMark size={44} />
              </div>
              <span className="inline-block text-cyan text-[11px] font-bold tracking-[0.2em] mb-5 px-3 py-1 rounded-full border border-cyan/25 bg-cyan/[0.06]">
                THE AUTONOMOUS AI OPERATING SYSTEM
              </span>
              <h1 className="font-head text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Ask anything.
              </h1>
              <p className="text-muted max-w-xl mb-10 mx-auto leading-relaxed">
                A real OmniMind agent — policy-checked, orchestrated, remembered — goes to work and answers.
              </p>

              <div className="w-full">
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
              </div>

              <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs text-muted bg-white/[0.03] hover:bg-white/[0.07] hover:text-white border border-white/[0.07] hover:border-accent/40 rounded-full px-4 py-2 transition-all hover:-translate-y-0.5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="flex-1 overflow-y-auto px-4 sm:px-0">
              <div className="max-w-3xl mx-auto w-full py-8 space-y-7">
                {messages.map((m) => (
                  <MessageRow key={m.id} message={m} />
                ))}
                <div ref={bottomRef} />
              </div>
            </section>

            <div className="border-t border-white/[0.06] bg-bg/80 backdrop-blur-xl px-4 sm:px-0 py-4">
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
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="bg-gradient-to-br from-accent to-accent/80 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%] text-sm sm:text-base whitespace-pre-wrap shadow-lg shadow-accent/10">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start animate-fadeIn">
      <div className="shrink-0 mt-0.5">
        <LogoMark size={26} />
      </div>
      <div
        className={`flex-1 min-w-0 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-0.5 ${
          message.status === "error" ? "text-red-400" : "text-white/90"
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
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-cyan animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-cyan animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-cyan animate-bounce" />
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
      <div className="flex items-end gap-2 bg-card/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl pl-4 pr-2 py-2 focus-within:border-accent/60 focus-within:shadow-glow shadow-panel transition-all">
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
          placeholder="Ask OmniMind anything…"
          className="flex-1 min-w-0 bg-transparent outline-none resize-none placeholder:text-mutedDark text-sm sm:text-base py-2 max-h-[200px]"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <span className="h-2 w-2 rounded-sm bg-white" />
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="shrink-0 bg-gradient-to-br from-accent to-accent/90 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-white text-sm font-bold px-5 py-2.5 rounded-xl"
          >
            Ask
          </button>
        )}
      </div>
    </form>
  );
}
