"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { streamAgent } from "@/lib/api";
import { newId } from "@/lib/conversations";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Msg = { id: string; role: "user" | "assistant"; content: string; streaming?: boolean };

// Helen has its own dedicated help system (components/helen/HelpModal.tsx)
// and /chat already puts the user directly in front of the full agent --
// a second floating widget there would just compete with the sidebar's
// bottom-left account bar for the same corner. Everywhere else (home,
// pricing, guide, mission-control, voxstudio, settings...) gets it.
const HIDDEN_PREFIXES = ["/helen", "/chat"];

// Routes real questions to the same credit-gated, server-enforced agent
// endpoint /chat uses (see lib/api.ts's streamAgent) -- "AI first" here
// means the actual OmniMind agent, not a canned FAQ bot, and it shares
// the same trial/credit budget rather than opening an unmetered side
// door. The "still need a person" escalation is a real inbox via Resend
// (/api/help/contact), not a fabricated live chat.
export default function HelpWidget() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [contactState, setContactState] = useState<"idle" | "sending" | "sent">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  function ask(text: string) {
    const q = text.trim();
    if (!q || streaming) return;
    const userMsg: Msg = { id: newId(), role: "user", content: q };
    const assistantId = newId();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const prompt = `You're answering a quick question inside OmniMind's small Help widget, not the main chat -- keep it to a few sentences. Question: ${q}`;

    function patch(patch: Partial<Msg>) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));
    }

    streamAgent(
      prompt,
      {
        onDelta: (delta) => setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))),
        onDone: () => {
          patch({ streaming: false });
          setStreaming(false);
        },
        onError: (msg) => {
          patch({ content: msg, streaming: false });
          setStreaming(false);
        },
        onBlocked: () => {
          patch({ content: t.chatTrialEnded, streaming: false });
          setStreaming(false);
        },
      },
      controller.signal
    );
  }

  async function sendContact() {
    const message = contactMsg.trim();
    if (!message || contactState === "sending") return;
    setContactState("sending");
    try {
      const res = await fetch("/api/help/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setContactState(res.ok ? "sent" : "idle");
      if (res.ok) setContactMsg("");
    } catch {
      setContactState("idle");
    }
  }

  const faqs = [t.helpFaq1, t.helpFaq2, t.helpFaq3];

  return (
    <>
      {open && (
        <div className="fixed bottom-20 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-card/95 backdrop-blur-xl border border-white/[0.08] shadow-panel flex flex-col max-h-[70vh] animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
            <p className="text-sm font-semibold text-white">{t.helpTitle}</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-mutedDark hover:text-white p-1 transition-colors">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[100px]">
            {messages.length === 0 && (
              <>
                <p className="text-xs text-muted leading-relaxed">{t.helpGreeting}</p>
                <div className="flex flex-wrap gap-1.5">
                  {faqs.map((f) => (
                    <button
                      key={f}
                      onClick={() => ask(f)}
                      className="text-[11px] text-muted bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] rounded-full px-2.5 py-1.5 transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div
                  className={`text-xs leading-relaxed rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                    m.role === "user" ? "bg-accent/80 text-white" : "bg-white/[0.04] text-white/90"
                  }`}
                >
                  {m.content || (m.streaming ? "…" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="px-3 pb-2.5 shrink-0"
          >
            <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl pl-2.5 pr-1.5 py-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.helpPlaceholder}
                className="flex-1 min-w-0 bg-transparent outline-none text-xs placeholder:text-mutedDark py-1.5"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="text-[11px] font-bold text-accent disabled:opacity-30 px-2 py-1.5 transition-opacity"
              >
                {t.chatAskButton}
              </button>
            </div>
          </form>

          <div className="border-t border-white/[0.06] px-4 py-3 shrink-0">
            <p className="text-[11px] font-semibold text-white mb-1">{t.helpHumanTitle}</p>
            <p className="text-[11px] text-mutedDark leading-relaxed mb-2">{t.helpHumanBody}</p>
            {contactState === "sent" ? (
              <p className="text-[11px] text-emerald">{t.helpContactSent}</p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendContact();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder={t.helpContactPlaceholder}
                  className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs outline-none placeholder:text-mutedDark"
                />
                <button
                  type="submit"
                  disabled={contactState === "sending" || !contactMsg.trim()}
                  className="shrink-0 text-[11px] font-bold text-white bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-30 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {contactState === "sending" ? "…" : t.helpContactSend}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.helpTitle}
        className="fixed bottom-4 left-4 z-50 flex items-center justify-center gap-1.5 h-10 w-10 sm:h-auto sm:w-auto rounded-full bg-card/70 backdrop-blur-xl border border-white/[0.08] text-mutedDark hover:text-white hover:border-accent/30 sm:pl-2.5 sm:pr-3 sm:py-2 text-xs font-medium shadow-panel transition-colors"
      >
        <HelpIcon />
        {/* Icon-only on narrow screens -- a wider text pill in this corner
            can overlap short mobile heroes' primary CTA (measured: 14px
            overlap with the homepage's "Enter Mission Control" button at
            375x812). A 40px circle clears it; desktop keeps the label. */}
        <span className="hidden sm:inline">{t.helpTitle}</span>
      </button>
    </>
  );
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
