"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { nextTierUrgency, padId } from "@/lib/helen/domain";

interface RecentMember {
  id: number;
  username: string | null;
  tier: string;
  createdAt: string;
}

const SITE_URL = "https://omnimindai.app";
const MUSIC_VOLUME = 0.35;
const FADE_MS = 1200;

function fadeTo(audio: HTMLAudioElement, target: number) {
  const start = audio.volume;
  const startTime = performance.now();
  function step(now: number) {
    const t = Math.min(1, Math.max(0, (now - startTime) / FADE_MS));
    audio.volume = Math.min(1, Math.max(0, start + (target - start) * t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const CAPTIONS = [
  "One world. Built together, one person at a time.",
  "Join for €1 — get your permanent Member ID and hatch your creature.",
  "Every membership feeds our real Impact Fund.",
  "Members vote on which charities get funded next.",
  "The first 100 members become LEGENDARY FOUNDERS — forever.",
];

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Animates a displayed integer toward `target` over a short tween instead
 *  of jumping — reads better on a livestream when the count ticks up. */
function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const delta = target - start;
    if (delta === 0) return;
    const durationMs = 900;
    const startTime = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(start + delta * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

export default function LivePage() {
  const [memberCount, setMemberCount] = useState(0);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [musicBlocked, setMusicBlocked] = useState(false);
  const [, forceTick] = useState(0);
  const displayedCount = useCountUp(memberCount);

  // Same ambient track as the rest of the app — this screen is meant to
  // run unattended for the whole stream, so it loops continuously rather
  // than fading out like BackgroundMusic.tsx does once inside /home.
  useEffect(() => {
    const audio = new Audio("/helen/audio/ambient.m4a");
    audio.loop = true;
    audio.volume = 0;

    function tryPlay() {
      audio
        .play()
        .then(() => {
          setMusicBlocked(false);
          fadeTo(audio, MUSIC_VOLUME);
        })
        .catch(() => setMusicBlocked(true));
    }

    function onFirstInteraction() {
      tryPlay();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    }

    tryPlay();
    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/helen/api/live-feed");
        if (!res.ok) return;
        const data = (await res.json()) as {
          configured: boolean;
          memberCount: number;
          recentMembers: RecentMember[];
        };
        if (!cancelled && data.configured) {
          setMemberCount(data.memberCount);
          setRecentMembers(data.recentMembers);
        }
      } catch {
        // keep showing the last good numbers
      }
    }
    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCaptionIndex((i) => (i + 1) % CAPTIONS.length), 6000);
    return () => clearInterval(interval);
  }, []);

  // Keeps "X ago" timestamps in the recent-joins list fresh without waiting
  // on the next /api/live-feed poll.
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    QRCode.toDataURL(SITE_URL, { width: 220, margin: 1, color: { dark: "#241B2F", light: "#F5EFE0" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  const urgency = nextTierUrgency(memberCount);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-helen-ink font-helen-body text-helen-paper">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(232,181,77,0.12), transparent 45%), radial-gradient(circle at 80% 80%, rgba(242,121,92,0.12), transparent 45%)",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-8">
        <div className="flex items-center gap-3">
          <span className="font-helen-display text-3xl font-semibold tracking-[0.14em] text-helen-gold">HELEN</span>
        </div>
        <div className="flex items-center gap-3">
          {musicBlocked && (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-helen-dim">
              🔇 Click anywhere to start music
            </span>
          )}
          <div className="flex items-center gap-2 rounded-full bg-helen-coral/15 px-4 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-helen-coral" />
            <span className="font-helen-num text-sm font-bold tracking-widest text-helen-coral">LIVE</span>
          </div>
        </div>
      </div>

      {/* Center: big counter */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
        <div className="font-helen-num text-[10vw] font-bold leading-none text-helen-paper drop-shadow-[0_4px_24px_rgba(232,181,77,0.35)]">
          {displayedCount.toLocaleString("en-US")}
        </div>
        <div className="font-helen-display text-2xl tracking-[0.3em] text-helen-gold">MEMBERS WORLDWIDE</div>

        {urgency && (
          <div className="mt-4 rounded-full border border-helen-gold/40 bg-helen-gold/10 px-8 py-3 text-xl font-semibold text-helen-gold">
            🏆 Only {urgency.spotsLeft.toLocaleString("en-US")} spots left for {urgency.tierName} status
          </div>
        )}

        <div className="mt-2 h-8 font-helen-display text-lg text-helen-dim transition-opacity duration-500">
          {CAPTIONS[captionIndex]}
        </div>
      </div>

      {/* Recent joins ticker */}
      {recentMembers.length > 0 && (
        <div className="relative z-10 mx-10 mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-black/30 px-6 py-4 backdrop-blur-sm">
          <span className="font-helen-display text-sm font-semibold text-helen-sage">✨ Just joined</span>
          {recentMembers.slice(0, 5).map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-white/[0.06] px-4 py-1.5 font-helen-num text-sm text-helen-paper"
            >
              {m.username ?? `Member ${padId(m.id)}`} · {timeAgo(m.createdAt)}
            </span>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="relative z-10 flex items-center justify-between gap-8 bg-gradient-to-t from-black/50 to-transparent px-10 pb-10 pt-6">
        <div>
          <div className="font-helen-display text-3xl font-bold text-helen-paper">Join now for €1</div>
          <div className="mt-1 font-helen-num text-2xl tracking-wide text-helen-coral">omnimindai.app</div>
          <div className="mt-2 max-w-md text-sm text-helen-dim">
            Get your permanent Member ID, hatch your own creature, and help decide which charities we fund —
            before the founder spots are gone.
          </div>
        </div>
        {qrDataUrl && (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-helen-paper p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code to join HELEN" width={140} height={140} />
            <span className="font-helen-num text-[11px] font-bold text-helen-ink">SCAN TO JOIN</span>
          </div>
        )}
      </div>
    </div>
  );
}
