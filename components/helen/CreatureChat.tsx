"use client";

import { track } from "@vercel/analytics";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { playCreatureAudio, speakAsCreature, unlockSpeech } from "@/lib/helen/speech";
import { playChatCloseSound, playChatOpenSound, playMessageSound } from "@/lib/helen/sound";
import type { CreatureStage } from "@/lib/helen/types";
import { isVoiceInputSupported, startVoiceInput } from "@/lib/helen/voiceInput";
import { CreatureImage } from "./CreatureImage";

interface ChatTurn {
  role: "user" | "creature";
  text: string;
}

interface CreatureChatProps {
  open: boolean;
  onClose: () => void;
  stage: CreatureStage;
  context: { level: number; happiness: number; streak: number; memberId: number; name: string | null };
}

type InputMode = "voice" | "text";

export function CreatureChat({ open, onClose, stage, context }: CreatureChatProps) {
  const { t, lang } = useLanguage();
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [mode, setMode] = useState<InputMode>("voice");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supported = isVoiceInputSupported();
    setVoiceSupported(supported);
    if (!supported) setMode("text");
  }, []);

  useEffect(() => {
    if (open) {
      playChatOpenSound();
      if (history.length === 0) setHistory([{ role: "creature", text: t.creatureTapFallback }]);
    } else {
      stopListeningRef.current?.();
      setListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, sending]);

  if (!open) return null;

  function handleClose() {
    playChatCloseSound();
    onClose();
  }

  async function fetchAndSpeak(text: string) {
    try {
      const res = await fetch("/helen/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const { audio } = (await res.json()) as { audio: string | null };
        if (audio) {
          playCreatureAudio(audio, text, lang);
          return;
        }
      }
    } catch {
      // fall through to client-side speech below
    }
    speakAsCreature(text, lang);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    unlockSpeech();
    track("chat_message_sent", { mode });
    const nextHistory = [...history, { role: "user" as const, text }];
    setHistory(nextHistory);
    setSending(true);
    try {
      const res = await fetch("/helen/api/creature-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: context.level,
          happiness: context.happiness,
          streak: context.streak,
          memberId: context.memberId,
          name: context.name,
          lang,
          clientTime: new Date().toString(),
          userMessage: text,
          history: nextHistory.slice(0, -1),
          skipAudio: true,
        }),
      });
      if (res.ok) {
        const { message } = (await res.json()) as { message: string; audio: string | null };
        setHistory((h) => [...h, { role: "creature", text: message }]);
        playMessageSound();
        fetchAndSpeak(message);
      } else {
        setAiAvailable(false);
        setHistory((h) => [...h, { role: "creature", text: t.creatureTapFallback }]);
        speakAsCreature(t.creatureTapFallback, lang);
      }
    } catch {
      setAiAvailable(false);
      setHistory((h) => [...h, { role: "creature", text: t.creatureTapFallback }]);
    } finally {
      setSending(false);
    }
  }

  function handleSendTyped() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }

  function handleMicTap() {
    if (listening) {
      stopListeningRef.current?.();
      setListening(false);
      return;
    }
    unlockSpeech();
    setMicDenied(false);
    setListening(true);
    stopListeningRef.current = startVoiceInput(
      lang,
      (transcript) => {
        setListening(false);
        sendMessage(transcript);
      },
      (reason) => {
        setListening(false);
        if (reason === "denied" || reason === "unsupported") {
          setMicDenied(true);
          setVoiceSupported(false);
          setMode("text");
        }
      },
      () => setListening(false),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="flex h-[88vh] w-full max-w-[480px] flex-col rounded-t-3xl border-t border-helen-gold/15 bg-helen-ink-2">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <CreatureImage stage={stage} height={44} />
          <div className="flex-1 font-helen-display text-base font-semibold">{t.chatTitle}</div>
          <button type="button" onClick={handleClose} aria-label={t.closeLabel} className="px-1 text-2xl leading-none text-helen-dim">
            ✕
          </button>
        </div>
        {!aiAvailable && <div className="px-4 pt-2 text-[11px] text-helen-dim">{t.chatAiOfflineNote}</div>}
        {micDenied && <div className="px-4 pt-2 text-[11px] text-helen-dim">{t.chatMicDenied}</div>}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {history.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  turn.role === "user" ? "bg-helen-coral text-helen-ink" : "bg-white/[0.08] text-helen-paper"
                }`}
              >
                {turn.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/[0.08] px-4 py-2.5 text-[15px] text-helen-dim">…</div>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {mode === "voice" ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                type="button"
                onClick={handleMicTap}
                disabled={sending}
                aria-label={t.chatTapToTalk}
                className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl text-helen-ink shadow-lg transition disabled:opacity-50 ${
                  listening ? "animate-pulse bg-helen-coral" : "bg-helen-coral"
                }`}
              >
                🎤
              </button>
              <div className="text-sm font-semibold text-helen-paper">
                {listening ? t.chatListening : sending ? t.chatThinking : t.chatTapToTalk}
              </div>
              <button type="button" onClick={() => setMode("text")} className="mt-0.5 text-[12px] text-helen-gold underline">
                {t.chatSwitchToText}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex w-full gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendTyped();
                  }}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 rounded-full bg-white/[0.07] px-5 py-3.5 text-[15px] text-helen-paper outline-none placeholder:text-helen-dim"
                />
                <button
                  type="button"
                  onClick={handleSendTyped}
                  disabled={sending || !input.trim()}
                  className="rounded-full bg-helen-coral px-5 py-3.5 text-[15px] font-bold text-helen-ink disabled:opacity-50"
                >
                  {t.chatSendBtn}
                </button>
              </div>
              {voiceSupported && (
                <button type="button" onClick={() => setMode("voice")} className="text-[12px] text-helen-gold underline">
                  {t.chatSwitchToVoice}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
