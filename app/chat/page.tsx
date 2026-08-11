"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { streamAgent, type BlockedReason } from "@/lib/api";
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
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { notifyCreditsChanged } from "@/lib/useCredits";
import { GUEST_TRIAL_MINUTES } from "@/lib/guestTrial";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/types";

function describeBlocked(info: BlockedReason, t: Dictionary): string {
  if (info.reason === "cooldown") {
    const mins = Math.max(1, Math.round((new Date(info.retryAt).getTime() - Date.now()) / 60000));
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    const wait = hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;
    return t.chatOutOfCreditsCooldown.replace("{wait}", wait);
  }
  return t.chatOutOfCreditsGeneric;
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
    </svg>
  );
}

const GUEST_TRIAL_MS = GUEST_TRIAL_MINUTES * 60_000;

function TrialBadge({ remainingMs, className = "" }: { remainingMs: number | null; className?: string }) {
  const { t } = useLanguage();
  const ms = remainingMs ?? GUEST_TRIAL_MS;
  const totalSeconds = Math.ceil(ms / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const pct = Math.max(0, Math.min(100, (ms / GUEST_TRIAL_MS) * 100));

  return (
    <div className={`flex items-center gap-2.5 text-xs text-muted ${className}`}>
      <span className="whitespace-nowrap">
        {t.chatTrialLabel} — <span className="font-semibold text-white tabular-nums">{mm}:{ss}</span> {t.chatTrialLeftSuffix}
      </span>
      <div className="h-1 flex-1 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ${pct <= 20 ? "bg-crimson" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  // null = not a guest concern yet (still resolving session, or signed in);
  // a number once we know -- ms left in the 5-minute trial, ticked down
  // client-side for display only. The real check happens server-side on
  // every send (see /api/chat/stream reading the httpOnly trial cookie),
  // so a manipulated display value here can't buy extra real usage.
  const [guestTrialMs, setGuestTrialMs] = useState<number | null>(null);
  const isGuest = sessionStatus !== "loading" && !session?.user;
  const guestTrialExpired = isGuest && guestTrialMs !== null && guestTrialMs <= 0;

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Whether the message currently being composed came in via the mic --
  // true from a voice transcript, cleared the moment the user types
  // (keyboard edits mean they've switched out of a spoken exchange).
  // Drives whether the reply gets spoken back, for a real back-and-forth
  // voice conversation instead of a one-off dictation.
  const voiceTurnRef = useRef(false);

  const handleVoiceText = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    voiceTurnRef.current = true;
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);
  const speech = useSpeechRecognition(handleVoiceText);

  function onComposerChange(v: string) {
    voiceTurnRef.current = false;
    setInput(v);
    autoGrow();
  }

  function stopSpeaking() {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setSpeakingId(null);
  }

  async function speakReply(assistantId: string, text: string) {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/chat/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.audio || !audioRef.current) return;
      audioRef.current.src = `data:audio/mpeg;base64,${body.audio}`;
      setSpeakingId(assistantId);
      audioRef.current.onended = () => setSpeakingId(null);
      await audioRef.current.play().catch(() => setSpeakingId(null));
    } catch {
      // no voice this turn -- the text reply already stands on its own
    }
  }

  useEffect(() => {
    setConversations(loadConversations());
    setSidebarCollapsed(window.innerWidth < 1024);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConversations(conversations);
  }, [conversations, hydrated]);

  // Starts (or re-syncs, on a page refresh) the guest trial the moment we
  // know there's no session -- the server sets/reads the actual httpOnly
  // cookie; this just mirrors the remaining time for display and ticks it
  // down locally so the countdown doesn't need a network call every second.
  useEffect(() => {
    if (!isGuest) return;
    let cancelled = false;
    fetch("/api/chat/guest-trial", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setGuestTrialMs(typeof data.remainingMs === "number" ? data.remainingMs : 0);
      })
      .catch(() => {
        if (!cancelled) setGuestTrialMs(0);
      });
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  useEffect(() => {
    if (guestTrialMs === null || guestTrialMs <= 0) return;
    const interval = setInterval(() => {
      setGuestTrialMs((ms) => (ms === null ? null : Math.max(0, ms - 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [guestTrialMs !== null && guestTrialMs > 0]);

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
    // Guests get a real 5-minute trial (see /api/chat/guest-trial), not
    // unlimited free usage -- the server re-checks the actual elapsed time
    // from an httpOnly cookie on every send regardless of what this client
    // thinks the countdown says, so this is a UX guard, not the real gate.
    if (guestTrialExpired) {
      router.push("/login?next=/chat");
      return;
    }

    const spokenTurn = !isGuest && voiceTurnRef.current;
    voiceTurnRef.current = false;
    stopSpeaking();

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

    let waking = false;
    let fullText = "";

    await streamAgent(
      q,
      {
        onDelta: (text) => {
          fullText = waking ? text : fullText + text;
          updateConversation(id!, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId ? { ...m, content: waking ? text : m.content + text } : m
            ),
          }));
          waking = false;
        },
        onDone: () => {
          patchAssistant({ status: "done" });
          if (spokenTurn) speakReply(assistantId, fullText);
          // Credits deduct just after the stream closes server-side — a
          // short delay avoids fetching the balance a beat before that
          // write lands.
          setTimeout(() => notifyCreditsChanged(), 600);
        },
        onError: (message) => patchAssistant({ content: message, status: "error" }),
        onBlocked: (info) => patchAssistant({ content: describeBlocked(info, t), status: "error" }),
        onWaking: () => {
          waking = true;
          patchAssistant({ content: t.chatWaking });
        },
      },
      controller.signal
    );

    setIsStreaming(false);
  }

  function stop() {
    abortRef.current?.abort();
    setIsStreaming(false);
    stopSpeaking();
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

  function deleteConversation(id: string) {
    if (id === activeId && isStreaming) stop();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
  }

  function clearAllConversations() {
    if (isStreaming) stop();
    setConversations([]);
    setActiveId(null);
  }

  function selectConversation(id: string) {
    if (isStreaming) stop();
    setActiveId(id);
    if (window.innerWidth < 1024) setSidebarCollapsed(true);
  }

  const empty = messages.length === 0;

  return (
    <div className="relative isolate flex h-screen overflow-hidden">
      <div className="bg-mesh -z-10" aria-hidden />
      <div className="bg-grid -z-10" aria-hidden />
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={deleteConversation}
        onClearAll={clearAllConversations}
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
                {t.heroBadge}
              </span>
              <h1 className="font-head text-4xl sm:text-5xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                {t.heroLine1}
              </h1>
              <p className="text-muted max-w-xl mb-10 mx-auto leading-relaxed">{t.chatHeroSub}</p>

              {guestTrialExpired ? (
                <button
                  type="button"
                  onClick={() => router.push("/login?next=/chat")}
                  className="glass rounded-2xl px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all hover:-translate-y-0.5"
                >
                  {t.chatTrialEnded}
                </button>
              ) : (
                <>
                  {isGuest && <TrialBadge remainingMs={guestTrialMs} className="mb-3" />}
                  <div className="w-full">
                    <Composer
                      value={input}
                      onChange={onComposerChange}
                      onSubmit={() => send()}
                      disabled={isStreaming}
                      textareaRef={textareaRef}
                      autoFocus
                      speech={isGuest ? undefined : speech}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-2xl">
                    {[t.chatSuggestion1, t.chatSuggestion2, t.chatSuggestion3, t.chatSuggestion4].map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs text-muted bg-white/[0.03] hover:bg-white/[0.07] hover:text-white border border-white/[0.07] hover:border-accent/40 rounded-full px-4 py-2 transition-all hover:-translate-y-0.5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="flex-1 overflow-y-auto px-4 sm:px-0">
              <div className="min-h-full flex flex-col justify-end max-w-3xl mx-auto w-full py-8 space-y-7">
                {messages.map((m) => (
                  <MessageRow key={m.id} message={m} speaking={speakingId === m.id} />
                ))}
                <div ref={bottomRef} />
              </div>
            </section>

            <div className="border-t border-white/[0.06] bg-bg/80 backdrop-blur-xl px-4 sm:px-0 py-4">
              <div className="max-w-3xl mx-auto w-full">
                {isGuest && <TrialBadge remainingMs={guestTrialMs} className="mb-3" />}
                {guestTrialExpired ? (
                  <button
                    type="button"
                    onClick={() => router.push("/login?next=/chat")}
                    className="w-full rounded-2xl px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-br from-accent/90 to-accent/70 hover:from-accent hover:to-accent/80 shadow-glow transition-all"
                  >
                    {t.chatTrialEnded}
                  </button>
                ) : (
                  <Composer
                    value={input}
                    onChange={onComposerChange}
                    onSubmit={() => send()}
                    disabled={isStreaming}
                    textareaRef={textareaRef}
                    streaming={isStreaming}
                    onStop={stop}
                    speech={isGuest ? undefined : speech}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

function MessageRow({ message, speaking }: { message: ChatMessage; speaking?: boolean }) {
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
      <div className={`shrink-0 mt-0.5 relative ${speaking ? "animate-pulse" : ""}`}>
        <LogoMark size={26} />
        {speaking && (
          <span
            className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-cyan shadow-[0_0_0_3px_rgba(6,7,26,1)]"
            title="Speaking"
          />
        )}
      </div>
      <div
        className={`flex-1 min-w-0 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-0.5 ${
          message.status === "error" ? "text-red-400" : "text-white/90"
        }`}
      >
        {message.content || (message.status === "streaming" ? <ThinkingVideo /> : null)}
        {message.status === "streaming" && message.content && (
          <span className="inline-block w-1.5 h-4 bg-cyan/80 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  );
}

// Higgsfield-generated (seedance_2_5) clip: an AI in an intense thinking
// state, shown for the gap between "sent" and the first token arriving.
// Hosted on Higgsfield's own CDN rather than self-hosted in /public --
// this environment's network policy couldn't reach that CDN to download a
// local copy, so this references their URL directly. If it ever needs to
// come off that dependency, regenerate and place it under /public/videos.
const THINKING_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3H6UhncW5DoRLIfEn3yyJY05j6D/hf_20260810_190517_2b815241-a0b0-404f-a50b-4746a9432b68.mp4";

function ThinkingVideo() {
  return (
    <span className="block w-44 sm:w-52 aspect-video rounded-xl overflow-hidden border border-white/[0.08] shadow-glow my-1">
      <video
        src={THINKING_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
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
  speech,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  autoFocus?: boolean;
  streaming?: boolean;
  onStop?: () => void;
  speech?: ReturnType<typeof useSpeechRecognition>;
}) {
  const { t } = useLanguage();
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
          placeholder={speech?.listening ? t.chatComposerListening : t.chatComposerPlaceholder}
          className="flex-1 min-w-0 bg-transparent outline-none resize-none placeholder:text-mutedDark text-sm sm:text-base py-2 max-h-[200px]"
        />
        {speech?.supported && (
          <button
            type="button"
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
            title={speech.listening ? t.chatMicStopTitle : t.chatMicSpeakTitle}
            className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-xl transition-colors ${
              speech.listening
                ? "bg-crimson/20 text-crimson animate-pulse"
                : "bg-white/[0.04] text-muted hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <MicIcon />
          </button>
        )}
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <span className="h-2 w-2 rounded-sm bg-white" />
            {t.chatStopButton}
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="shrink-0 bg-gradient-to-br from-accent to-accent/90 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity text-white text-sm font-bold px-5 py-2.5 rounded-xl"
          >
            {t.chatAskButton}
          </button>
        )}
      </div>
      {speech?.error && <p className="text-xs text-crimson mt-2 px-1">{speech.error}</p>}
    </form>
  );
}
