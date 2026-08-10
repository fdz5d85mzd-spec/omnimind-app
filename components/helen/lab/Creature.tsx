"use client";

import { useAnimationControls, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { spikeAngles, spikePath, STAGE_SHAPES } from "@/lib/helen/lab/creatureShape";
import { paletteForStage } from "@/lib/helen/lab/palette";
import type { Mood } from "@/lib/helen/lab/creatureStore";

interface CreatureProps {
  stage: number;
  mood: Mood;
  /** Bump this number to play a feed (jump) reaction. */
  feedSignal: number;
  /** Bump this number to play a level-up (glow burst) reaction. */
  levelUpSignal: number;
  reducedMotion: boolean;
}

const SIZE = 240;
const CENTER = SIZE / 2;

function mouthPath(mood: Mood): string {
  const y = CENTER + 14;
  if (mood === "happy") return `M ${CENTER - 12} ${y} Q ${CENTER} ${y + 10} ${CENTER + 12} ${y}`;
  if (mood === "sad") return `M ${CENTER - 12} ${y + 6} Q ${CENTER} ${y - 6} ${CENTER + 12} ${y + 6}`;
  return `M ${CENTER - 10} ${y} L ${CENTER + 10} ${y}`;
}

export function Creature({ stage, mood, feedSignal, levelUpSignal, reducedMotion }: CreatureProps) {
  const shape = STAGE_SHAPES[Math.min(stage, STAGE_SHAPES.length) - 1];
  const palette = paletteForStage(stage);
  const bodyControls = useAnimationControls();
  const glowControls = useAnimationControls();
  const [blinking, setBlinking] = useState(false);
  const blinkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Idle squash & stretch loop.
  useEffect(() => {
    if (reducedMotion) {
      bodyControls.set({ scale: 1, y: 0 });
      return;
    }
    bodyControls.start({
      scaleY: [1, 1.05, 0.97, 1],
      scaleX: [1, 0.97, 1.04, 1],
      y: [0, -6, 0, 0],
      transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
    });
  }, [reducedMotion, bodyControls, stage]);

  // Blink loop — same "schedule, hold briefly, reschedule" shape as the
  // production creature's real blink (components/CreatureImage.tsx).
  useEffect(() => {
    if (reducedMotion) return;
    function scheduleBlink() {
      const delay = 3000 + Math.random() * 2000;
      blinkTimeout.current = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 180);
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
    return () => {
      if (blinkTimeout.current) clearTimeout(blinkTimeout.current);
    };
  }, [reducedMotion]);

  // Feed reaction: a quick hop, retriggered every time feedSignal changes.
  useEffect(() => {
    if (feedSignal === 0) return;
    if (reducedMotion) {
      bodyControls.start({ scale: [1, 1.08, 1], transition: { duration: 0.3 } });
      return;
    }
    bodyControls.start({
      y: [0, -34, 0],
      scaleY: [1, 1.1, 0.9, 1],
      scaleX: [1, 0.92, 1.06, 1],
      transition: { duration: 0.55, ease: "easeOut" },
    });
  }, [feedSignal, reducedMotion, bodyControls]);

  // Level-up reaction: glow ring burst + a bigger scale pulse on the body.
  useEffect(() => {
    if (levelUpSignal === 0) return;
    glowControls.start({
      scale: [0.6, 2.2],
      opacity: [0.9, 0],
      transition: { duration: 0.9, ease: "easeOut" },
    });
    if (!reducedMotion) {
      bodyControls.start({
        scale: [1, 1.35, 1],
        transition: { duration: 0.7, ease: "easeOut" },
      });
    }
  }, [levelUpSignal, reducedMotion, glowControls, bodyControls]);

  const angles = spikeAngles(shape.spikes);
  const eyeOffsetX = shape.bodyR * 0.32;
  const eyeOffsetY = -shape.bodyR * 0.08;
  const eyeR = shape.bodyR * 0.1;

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      <motion.div
        animate={glowControls}
        initial={{ scale: 0.6, opacity: 0 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: palette.glow,
          filter: "blur(24px)",
        }}
      />
      <motion.svg
        animate={bodyControls}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ position: "relative" }}
      >
        {angles.map((angle, i) => (
          <path
            key={i}
            d={spikePath(CENTER, CENTER, shape.bodyR, angle, shape.spikeLen, shape.spikeWidth)}
            fill={palette.secondary}
          />
        ))}

        {shape.hasArms && (
          <>
            <ellipse cx={CENTER - shape.bodyR * 0.95} cy={CENTER + shape.bodyR * 0.3} rx={shape.bodyR * 0.22} ry={shape.bodyR * 0.16} fill={palette.primary} />
            <ellipse cx={CENTER + shape.bodyR * 0.95} cy={CENTER + shape.bodyR * 0.3} rx={shape.bodyR * 0.22} ry={shape.bodyR * 0.16} fill={palette.primary} />
          </>
        )}
        {shape.hasLegs && (
          <>
            <ellipse cx={CENTER - shape.bodyR * 0.35} cy={CENTER + shape.bodyR * 1.05} rx={shape.bodyR * 0.2} ry={shape.bodyR * 0.16} fill={palette.primary} />
            <ellipse cx={CENTER + shape.bodyR * 0.35} cy={CENTER + shape.bodyR * 1.05} rx={shape.bodyR * 0.2} ry={shape.bodyR * 0.16} fill={palette.primary} />
          </>
        )}

        <circle cx={CENTER} cy={CENTER} r={shape.bodyR} fill={palette.primary} />

        {shape.sparkles &&
          [-1, 1].map((sign) => (
            <motion.circle
              key={sign}
              cx={CENTER + sign * shape.bodyR * 1.25}
              cy={CENTER - shape.bodyR * 0.75}
              r={4}
              fill={palette.secondary}
              animate={reducedMotion ? undefined : { opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={reducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: sign > 0 ? 0.6 : 0 }}
            />
          ))}

        <motion.ellipse
          cx={CENTER - eyeOffsetX}
          cy={CENTER + eyeOffsetY}
          rx={eyeR}
          ry={blinking ? 0.5 : eyeR}
          fill="#241B2F"
        />
        <motion.ellipse
          cx={CENTER + eyeOffsetX}
          cy={CENTER + eyeOffsetY}
          rx={eyeR}
          ry={blinking ? 0.5 : eyeR}
          fill="#241B2F"
        />

        <path d={mouthPath(mood)} stroke="#241B2F" strokeWidth={3} strokeLinecap="round" fill="none" />
      </motion.svg>
    </div>
  );
}
