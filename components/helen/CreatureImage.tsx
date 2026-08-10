"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CreatureStage } from "@/lib/helen/types";

const CREATURE_SRC: Record<CreatureStage, string> = {
  1: "/helen/creatures/v2/stage-1.png",
  2: "/helen/creatures/v2/stage-2.png",
  3: "/helen/creatures/v2/stage-3.png",
  4: "/helen/creatures/v2/stage-4.png",
};

const CREATURE_BLINK_SRC: Record<CreatureStage, string> = {
  1: "/helen/creatures/v2/stage-1-blink.png",
  2: "/helen/creatures/v2/stage-2-blink.png",
  3: "/helen/creatures/v2/stage-3-blink.png",
  4: "/helen/creatures/v2/stage-4-blink.png",
};

interface CreatureImageProps {
  stage?: CreatureStage;
  height: number;
  className?: string;
  priority?: boolean;
}

/** Crossfades to a closed-eyes frame for a brief moment every few seconds —
 *  a simple two-frame flipbook blink, since the art is static PNGs rather
 *  than a rigged/skeletal character. */
export function CreatureImage({ stage = 1, height, className, priority }: CreatureImageProps) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function scheduleBlink() {
      const delay = 2600 + Math.random() * 4200;
      timer = setTimeout(() => {
        setBlinking(true);
        window.setTimeout(() => setBlinking(false), 220);
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative inline-block">
      <Image
        src={CREATURE_SRC[stage]}
        alt="HELEN creature"
        width={height}
        height={height}
        priority={priority}
        style={{ height, width: "auto" }}
        className={`block object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${
          blinking ? "opacity-0" : "opacity-100"
        } ${className ?? ""}`}
      />
      <Image
        src={CREATURE_BLINK_SRC[stage]}
        alt=""
        aria-hidden
        width={height}
        height={height}
        // Preload this too — without priority, Next/Image lazy-loads it,
        // so the very first blink could crossfade to an image that hasn't
        // finished downloading yet, showing a blank flash ("ghost")
        // instead of the closed-eyes frame.
        priority={priority}
        style={{ height, width: "auto" }}
        className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${
          blinking ? "opacity-100" : "opacity-0"
        } ${className ?? ""}`}
      />
    </div>
  );
}
