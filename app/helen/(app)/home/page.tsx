"use client";

import { track } from "@vercel/analytics";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CharityPopup } from "@/components/helen/CharityPopup";
import { CreatureChat } from "@/components/helen/CreatureChat";
import { CreatureImage } from "@/components/helen/CreatureImage";
import { CreatureReaction, type Reaction } from "@/components/helen/CreatureReaction";
import { GameButton } from "@/components/helen/GameButton";
import { HomeNavIcons } from "@/components/helen/HomeNavIcons";
import { GalleryModal } from "@/components/helen/GalleryModal";
import { LuckyWheelModal } from "@/components/helen/LuckyWheelModal";
import { RenameCreatureModal } from "@/components/helen/RenameCreatureModal";
import { RewardPopup } from "@/components/helen/RewardPopup";
import { ShareCardModal } from "@/components/helen/ShareCardModal";
import { StreakBar } from "@/components/helen/StreakBar";
import { hasShownCharityPopup, markCharityPopupShown } from "@/lib/helen/data/charityPopupRepo";
import { getLastGreetedDate, setLastGreetedDate } from "@/lib/helen/data/greetingRepo";
import {
  getLastSpinAt,
  hasShownFirstWheelPopup,
  markFirstWheelPopupShown,
  msUntilNextSpin,
} from "@/lib/helen/data/luckyWheelRepo";
import {
  CARE_POINTS_PER_ACTION,
  IMPACT_SHARE,
  LOW_HAPPINESS_THRESHOLD,
  MEMBERSHIP_PRICE_EUR,
  levelFor,
  padId,
  worldStageFor,
  xpProgressFor,
} from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import { useProfile } from "@/lib/helen/ProfileProvider";
import {
  playCleanSound,
  playFeedSound,
  playHappyReactionSound,
  playLevelUpSound,
  playLoveSound,
  playPlaySound,
  playPokeSound,
} from "@/lib/helen/sound";
import { playCreatureAudio, speakAsCreature, unlockSpeech } from "@/lib/helen/speech";
import { useRealStats } from "@/lib/helen/useRealStats";
import { startVoiceInput } from "@/lib/helen/voiceInput";

const CREATURE_GLOW = "rgba(232,181,77,0.6)";

let reactionKey = 0;

export default function HomeTab() {
  const { t, lang } = useLanguage();
  const { profile, feed, play, clean, share, setCreatureName, pendingDailyReward, clearPendingDailyReward } =
    useProfile();
  const { globalCount, shopRevenue } = useRealStats();
  const [shareOpen, setShareOpen] = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [bumping, setBumping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [wheelFirstTime, setWheelFirstTime] = useState(false);
  const [wheelReady, setWheelReady] = useState(false);
  const [charityPopupOpen, setCharityPopupOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const lastLevel = useRef<number | null>(null);
  const pendingGreetingRef = useRef<{ message: string; audio: string | null } | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const voiceHistoryRef = useRef<{ role: "user" | "creature"; text: string }[]>([]);

  const currentLevel = profile ? levelFor(profile.carePoints).level : null;

  useEffect(() => {
    if (currentLevel === null) return;
    if (lastLevel.current !== null && currentLevel > lastLevel.current) {
      playLevelUpSound();
      showReaction("✨");
    }
    lastLevel.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    function refreshWheelReady() {
      setWheelReady(getLastSpinAt() === null || msUntilNextSpin() <= 0);
    }
    refreshWheelReady();
    const interval = setInterval(refreshWheelReady, 30000);
    return () => clearInterval(interval);
  }, []);

  // The very first spin is nudged automatically 45s after signup, once —
  // profile.createdAt is set at signup, so this still fires correctly even
  // if the visitor lands on /home well after those 45s have already passed.
  useEffect(() => {
    if (!profile || hasShownFirstWheelPopup() || getLastSpinAt() !== null) return;
    const elapsedMs = Date.now() - new Date(profile.createdAt).getTime();
    const delayMs = Math.max(0, 45000 - elapsedMs);
    const timeout = setTimeout(() => {
      markFirstWheelPopupShown();
      setWheelFirstTime(true);
      setWheelOpen(true);
    }, delayMs);
    return () => clearTimeout(timeout);
  }, [profile]);

  // "Where your euro goes" popup, once per device, well before the 45s
  // wheel nudge above so the two never compete for attention.
  useEffect(() => {
    if (!profile || hasShownCharityPopup()) return;
    const timeout = setTimeout(() => {
      markCharityPopupShown();
      setCharityPopupOpen(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [profile]);

  // Speaking the greeting requires a user gesture to have already happened
  // once (browser autoplay policy) — the app just loaded, so nothing has
  // happened yet. Fetch it in the background and hold onto it until the
  // visitor's first tap anywhere, then speak it — no popup, voice only.
  useEffect(() => {
    function tryPlayPendingGreeting() {
      const pending = pendingGreetingRef.current;
      if (!pending) return;
      pendingGreetingRef.current = null;
      window.removeEventListener("pointerdown", tryPlayPendingGreeting);
      if (pending.audio) playCreatureAudio(pending.audio, pending.message, lang);
      else speakAsCreature(pending.message, lang);
    }
    window.addEventListener("pointerdown", tryPlayPendingGreeting);
    return () => window.removeEventListener("pointerdown", tryPlayPendingGreeting);
  }, [lang]);

  useEffect(() => {
    if (!profile) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastGreeted = getLastGreetedDate();
    if (lastGreeted === today) return;
    // No prior greeting at all means this is the very first time the
    // creature is meeting its owner after being named — it should
    // introduce itself, not just say good morning.
    const isFirstEver = lastGreeted === null;
    setLastGreetedDate(today);

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 5 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : hour < 22 ? "evening" : "night";

    (async () => {
      try {
        const res = await fetch("/helen/api/creature-speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            level: levelFor(profile.carePoints).level,
            happiness: profile.happiness,
            streak: profile.streak,
            memberId: profile.memberId,
            name: profile.creatureName,
            lang,
            clientTime: new Date().toString(),
            trigger: isFirstEver ? "introduction" : "greeting",
            timeOfDay,
          }),
        });
        if (res.ok) {
          const { message, audio } = (await res.json()) as { message: string; audio: string | null };
          pendingGreetingRef.current = { message, audio };
        }
      } catch {
        // greeting is a nice-to-have — silent failure is fine
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.memberId]);

  if (!profile) return null;

  function showReaction(emoji: string, message?: string, duration = 1600) {
    reactionKey += 1;
    setReaction({ key: reactionKey, emoji, message });
    setBumping(true);
    window.setTimeout(() => setBumping(false), 450);
    window.setTimeout(() => setReaction((r) => (r?.key === reactionKey ? null : r)), duration);
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

  async function sendVoiceMessage(text: string) {
    if (!profile) return;
    track("chat_message_sent", { mode: "voice" });
    const nextHistory = [...voiceHistoryRef.current, { role: "user" as const, text }];
    voiceHistoryRef.current = nextHistory;
    try {
      const res = await fetch("/helen/api/creature-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          happiness: profile.happiness,
          streak: profile.streak,
          memberId: profile.memberId,
          name: profile.creatureName,
          lang,
          clientTime: new Date().toString(),
          userMessage: text,
          history: nextHistory.slice(0, -1),
          skipAudio: true,
        }),
      });
      if (res.ok) {
        const { message } = (await res.json()) as { message: string; audio: string | null };
        voiceHistoryRef.current = [...nextHistory, { role: "creature", text: message }];
        showReaction("💬");
        fetchAndSpeak(message);
      } else {
        speakAsCreature(t.creatureTapFallback, lang);
      }
    } catch {
      speakAsCreature(t.creatureTapFallback, lang);
    }
  }

  function handleCreatureTap() {
    if (!profile) return;
    if (listening) {
      // A second tap while listening cancels — the mic may have been
      // triggered by accident, and a half-caught phrase should never send.
      stopListeningRef.current?.();
      setListening(false);
      setReaction((r) => (r?.emoji === "🎤" ? null : r));
      return;
    }
    playPokeSound();
    unlockSpeech();
    setBumping(true);
    window.setTimeout(() => setBumping(false), 450);
    setListening(true);
    showReaction("🎤", undefined, 6000);
    stopListeningRef.current = startVoiceInput(
      lang,
      (transcript) => {
        setListening(false);
        setReaction((r) => (r?.emoji === "🎤" ? null : r));
        sendVoiceMessage(transcript);
      },
      (reason) => {
        setListening(false);
        setReaction((r) => (r?.emoji === "🎤" ? null : r));
        if (reason === "denied" || reason === "unsupported") setChatOpen(true);
      },
      () => {
        setListening(false);
        setReaction((r) => (r?.emoji === "🎤" ? null : r));
      },
    );
  }

  function loveMoment() {
    playLoveSound();
    showReaction("💖");
    speakAsCreature(t.reactionLove, lang);
  }

  function handleFeed() {
    if (!profile || profile.missions.feed) return;
    const reachesLove = Math.min(100, profile.happiness + 15) >= 100 && profile.happiness < 100;
    feed();
    playFeedSound();
    showReaction("🍎", `🪙 +${CARE_POINTS_PER_ACTION} XP`);
    window.setTimeout(playHappyReactionSound, 180);
    if (reachesLove) window.setTimeout(loveMoment, 900);
  }

  function handlePlay() {
    if (!profile || profile.missions.play) return;
    const reachesLove = Math.min(100, profile.happiness + 10) >= 100 && profile.happiness < 100;
    play();
    playPlaySound();
    showReaction("🎾", `🪙 +${CARE_POINTS_PER_ACTION} XP`);
    window.setTimeout(playHappyReactionSound, 180);
    if (reachesLove) window.setTimeout(loveMoment, 900);
  }

  function handleClean() {
    if (!profile || profile.missions.clean) return;
    const reachesLove = Math.min(100, profile.happiness + 10) >= 100 && profile.happiness < 100;
    clean();
    playCleanSound();
    showReaction("✨", `🪙 +${CARE_POINTS_PER_ACTION} XP`);
    if (reachesLove) window.setTimeout(loveMoment, 900);
  }

  const stage = worldStageFor(globalCount ?? 0);
  const donated =
    globalCount !== null
      ? Math.round((globalCount * MEMBERSHIP_PRICE_EUR + shopRevenue) * IMPACT_SHARE)
      : null;
  const isSad = profile.happiness < LOW_HAPPINESS_THRESHOLD;
  const { level, scale, stage: creatureStage } = levelFor(profile.carePoints);
  const xp = xpProgressFor(profile.carePoints);

  return (
    <>
      <div className="relative -mx-4 mb-3.5 flex min-h-[78dvh] flex-1 flex-col overflow-hidden rounded-b-[2rem] bg-helen-ink-2 sm:-mx-5">
        <Image
          src="/helen/room-bg.png"
          alt=""
          fill
          priority
          sizes="480px"
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,12,30,.24)_0%,transparent_24%,transparent_58%,rgba(18,12,30,.82)_100%)]" />

        {/* Everything below floats directly over the scene image, top to
            bottom, so the pet screen reads as one fullscreen game view. */}
        <div className="relative z-10 flex h-full flex-col px-3 pb-3">
          <HomeNavIcons className="mb-2.5 mt-1" />

          <div className="mb-2 flex items-center justify-between">
            <div className="rounded-full bg-black/40 px-2.5 py-1 font-helen-num text-[10px] text-helen-gold backdrop-blur-sm">
              🔥 {profile.streak} · {t.idLabel} {padId(profile.memberId)}
            </div>
            <div className="rounded-full bg-black/40 px-2.5 py-1 font-helen-num text-[10px] tracking-wider text-helen-gold backdrop-blur-sm">
              {stage.label} · {t.levelLabel} {level}
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center">
            <div className="relative flex flex-col items-center">
              <CreatureReaction reaction={reaction} />
              <div className="relative animate-helen-idle">
                <button
                  type="button"
                  onClick={handleCreatureTap}
                  aria-label={t.chatTapToTalk}
                  className={`relative cursor-pointer transition-[filter,transform] duration-500 ${bumping ? "animate-helen-bump" : ""}`}
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "bottom center",
                    ...(isSad ? { filter: "saturate(0.35) brightness(0.75)" } : {}),
                  }}
                >
                  {listening && (
                    <span className="pointer-events-none absolute -inset-3 -z-10 animate-pulse rounded-full bg-helen-coral/25 blur-xl" />
                  )}
                  <CreatureImage stage={creatureStage} height={200} priority />
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  aria-label={t.chatTitle}
                  className="absolute right-1 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-[13px] backdrop-blur-sm"
                >
                  💬
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  aria-label={t.galleryTitle}
                  className="absolute left-1 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-[13px] backdrop-blur-sm"
                >
                  🖼️
                </button>
              </div>
              <div
                className="pointer-events-none -mt-2 h-3 w-28 rounded-[50%] blur-md"
                style={{ background: CREATURE_GLOW }}
              />
            </div>
          </div>

          {isSad && <p className="mb-1.5 text-center text-[11px] text-helen-coral drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{t.creatureSadNote}</p>}

          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={() => setRenameOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3.5 py-1.5 font-helen-display text-[14px] font-semibold text-helen-paper backdrop-blur-sm"
            >
              {profile.creatureName ?? t.nameYourCreature}
              <span aria-label={t.renameLabel} className="text-[11px] text-helen-dim">
                ✏️
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreatureTap}
            className={`mb-2.5 flex items-center justify-center gap-2 self-center rounded-full px-5 py-2 text-[12px] font-bold backdrop-blur-sm transition ${
              listening ? "animate-pulse bg-helen-coral/85 text-helen-ink" : "bg-black/35 text-helen-gold"
            }`}
          >
            <span className="text-[15px] leading-none">🎤</span>
            {listening ? t.chatListening : t.chatTapToTalk}
          </button>

          <div className="mb-2.5 rounded-xl bg-black/30 px-3 py-2.5 backdrop-blur-sm">
            <div className="mb-1 flex items-center justify-between font-helen-num text-[10px] text-helen-dim">
              <span>{t.happinessLabel}</span>
              <span className="text-helen-paper">{profile.happiness}%</span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-helen-coral transition-[width]"
                style={{ width: `${profile.happiness}%` }}
              />
            </div>
            <div className="mb-1 flex items-center justify-between font-helen-num text-[10px] text-helen-dim">
              <span>{t.levelLabel} {level}</span>
              <span className="text-helen-gold">
                {xp.maxed ? t.maxLevelLabel : `${xp.into} / ${xp.span} ${t.xpToNextLabel}`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-helen-gold transition-[width]"
                style={{ width: `${Math.round(xp.pct * 100)}%` }}
              />
            </div>
          </div>

          <StreakBar currentDay={((profile.streak - 1) % 7) + 1} />

          <button
            type="button"
            onClick={() => {
              setWheelFirstTime(false);
              setWheelOpen(true);
            }}
            className="mb-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-black/30 py-2 text-[12px] font-bold text-helen-gold backdrop-blur-sm"
          >
            {t.luckyWheelTitle}
            {wheelReady && <span className="h-1.5 w-1.5 rounded-full bg-helen-coral" />}
          </button>

          <div className="flex gap-2">
            <GameButton icon="🍎" label={t.feed} tone="coral" onClick={handleFeed} done={profile.missions.feed} />
            <GameButton icon="🎾" label={t.play} tone="sage" onClick={handlePlay} done={profile.missions.play} />
            <GameButton icon="🧼" label={t.clean} tone="gold" onClick={handleClean} done={profile.missions.clean} />
            <Link
              href="/helen/home/shop"
              className="group relative flex-1 overflow-hidden rounded-2xl border border-black/10 pb-2.5 pt-3 text-center shadow-[0_6px_0_rgba(0,0,0,0.25),0_10px_16px_rgba(0,0,0,0.35)] transition-transform active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.25)]"
              style={{ background: "linear-gradient(180deg, #C9B8DE 0%, #A98FC4 55%, #8A6FA6 100%)" }}
            >
              <span className="pointer-events-none absolute inset-x-1 top-1 h-1/2 rounded-xl bg-gradient-to-b from-white/50 to-white/0" />
              <span className="relative flex flex-col items-center gap-1">
                <span className="text-[22px] leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">🛍️</span>
                <span className="text-[11px] font-extrabold tracking-wide text-helen-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">
                  {t.tabShop}
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-2 rounded-xl bg-black/30 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center justify-between font-helen-num text-[10px] text-helen-dim">
              <span>🌍 {t.globalLabel}</span>
              <span className="text-helen-paper">
                {globalCount !== null ? globalCount.toLocaleString("en-US") : "—"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="font-helen-num text-[10px] text-helen-sage">
                🌱 {donated !== null ? `${donated.toLocaleString("en-US")} €` : "—"} {t.impactHomeLine}
              </span>
              <button
                type="button"
                onClick={() => {
                  share();
                  setShareOpen(true);
                }}
                className="shrink-0 rounded-full bg-helen-gold/25 px-3 py-1 text-[10px] font-bold text-helen-gold"
              >
                📤 {t.inviteBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShareCardModal open={shareOpen} onClose={() => setShareOpen(false)} profile={profile} />
      <CreatureChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        stage={creatureStage}
        context={{
          level,
          happiness: profile.happiness,
          streak: profile.streak,
          memberId: profile.memberId,
          name: profile.creatureName,
        }}
      />
      <RenameCreatureModal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        currentName={profile.creatureName}
        onSave={setCreatureName}
      />
      <GalleryModal open={galleryOpen} onClose={() => setGalleryOpen(false)} ownedItems={profile.ownedItems} />
      <LuckyWheelModal
        open={wheelOpen}
        onClose={() => {
          setWheelOpen(false);
          setWheelReady(getLastSpinAt() === null || msUntilNextSpin() <= 0);
        }}
        firstTime={wheelFirstTime}
      />
      <CharityPopup open={charityPopupOpen} onClose={() => setCharityPopupOpen(false)} />
      {pendingDailyReward && (
        <RewardPopup
          open
          xp={pendingDailyReward.xp}
          title={pendingDailyReward.weeklyBonus ? t.weeklyBonusNote : t.streakBarTitle}
          note={`${t.streakDayLabel} ${pendingDailyReward.streakDay}/7`}
          onClose={clearPendingDailyReward}
        />
      )}
    </>
  );
}
