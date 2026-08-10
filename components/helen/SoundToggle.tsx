"use client";

import { useEffect, useState } from "react";
import { getMuted, setMuted } from "@/lib/helen/data/settingsRepo";

export function SoundToggle() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(getMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute" : "Mute"}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/40 text-base text-helen-paper shadow-[0_2px_6px_rgba(0,0,0,0.3)] backdrop-blur-sm"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
