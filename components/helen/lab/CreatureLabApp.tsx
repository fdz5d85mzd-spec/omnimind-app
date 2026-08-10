"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/helen/lab/AnimatedBackground";
import { Creature } from "@/components/helen/lab/Creature";
import { ParticleBurst } from "@/components/helen/lab/ParticleBurst";
import { ShareCardPreview } from "@/components/helen/lab/ShareCardPreview";
import {
  hungerFromLastFed,
  moodFromHunger,
  STAGE_COUNT,
  stageForFeeds,
  stageProgress,
  useCreatureStore,
} from "@/lib/helen/lab/creatureStore";
import { paletteForStage } from "@/lib/helen/lab/palette";

/** Recomputed periodically since hunger drains purely with wall-clock time,
 *  not from a store mutation — nothing else would trigger a re-render. */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const REMINDER_AFTER_HOURS = 6;

export default function CreatureLabApp() {
  const { feedsCount, lastFedAt, streak, justLeveledUp, feed, clearLevelUp } = useCreatureStore();
  const now = useNow(15_000);
  const reducedMotion = useReducedMotion() ?? false;

  const [feedSignal, setFeedSignal] = useState(0);
  const [levelUpSignal, setLevelUpSignal] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [levelUpStage, setLevelUpStage] = useState(1);

  const stage = stageForFeeds(feedsCount);
  const hunger = hungerFromLastFed(lastFedAt, now);
  const mood = moodFromHunger(hunger);
  const progress = stageProgress(feedsCount);
  const palette = paletteForStage(stage);
  const hoursSinceFed = (now - lastFedAt) / 3_600_000;
  const showReminder = hoursSinceFed > REMINDER_AFTER_HOURS;

  useEffect(() => {
    if (!justLeveledUp) return;
    setLevelUpStage(stageForFeeds(feedsCount));
    setLevelUpSignal((n) => n + 1);
    setShareOpen(true);
    clearLevelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justLeveledUp]);

  function handleFeed() {
    feed();
    setFeedSignal((n) => n + 1);
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden px-4 pb-10 pt-8 text-helen-paper">
      <AnimatedBackground stage={stage} reducedMotion={reducedMotion} />

      <div className="mb-6 flex w-full max-w-sm items-center justify-between text-xs text-helen-dim">
        <span className="font-mono uppercase tracking-wider">HELEN Lab · Creature</span>
        <span className="font-mono">🔥 {streak}-day streak</span>
      </div>

      {showReminder && (
        <div className="mb-4 w-full max-w-sm rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-center text-xs text-helen-paper backdrop-blur-sm">
          Το πλασματάκι σου πεινάει! Δεν έχει φάει εδώ και {Math.floor(hoursSinceFed)}h.
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center">
        <ParticleBurst trigger={feedSignal} color={palette.secondary} reducedMotion={reducedMotion} />
        <Creature
          stage={stage}
          mood={mood}
          feedSignal={feedSignal}
          levelUpSignal={levelUpSignal}
          reducedMotion={reducedMotion}
        />
      </div>

      <div className="mb-5 w-full max-w-sm">
        <div className="mb-1 flex justify-between text-[11px] text-helen-dim">
          <span>Stage {stage} / {STAGE_COUNT}</span>
          <span>{progress.current} / {progress.needed} feeds</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress.pct}%`, background: palette.secondary }}
          />
        </div>
      </div>

      <div className="mb-6 w-full max-w-sm">
        <div className="mb-1 flex justify-between text-[11px] text-helen-dim">
          <span>Hunger</span>
          <span>{Math.round(hunger)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-helen-coral transition-[width] duration-500"
            style={{ width: `${hunger}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleFeed}
        className="w-full max-w-sm rounded-xl py-3.5 text-[15px] font-bold text-helen-ink transition active:scale-95"
        style={{ background: palette.secondary }}
      >
        Feed 🍎
      </button>

      <ShareCardPreview
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        stage={levelUpStage}
        streak={streak}
        feedsCount={feedsCount}
      />
    </div>
  );
}
