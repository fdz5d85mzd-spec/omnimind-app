"use client";

import { useEffect, useRef } from "react";
import { levelFor, padId } from "@/lib/helen/domain";
import { useLanguage } from "@/lib/helen/i18n/LanguageProvider";
import type { CreatureStage, Profile } from "@/lib/helen/types";

interface ShareCardModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}

const CREATURE_SRC: Record<CreatureStage, string> = {
  1: "/helen/creatures/v2/stage-1.png",
  2: "/helen/creatures/v2/stage-2.png",
  3: "/helen/creatures/v2/stage-3.png",
  4: "/helen/creatures/v2/stage-4.png",
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function ShareCardModal({ open, onClose, profile }: ShareCardModalProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const { stage } = levelFor(profile.carePoints);

    Promise.all([document.fonts.ready, loadImage(CREATURE_SRC[stage])]).then(([, creatureImg]) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const cw = 320;
      const ch = 220;
      const grad = ctx.createLinearGradient(0, 0, cw, ch);
      grad.addColorStop(0, "#3A2C4A");
      grad.addColorStop(1, "#241B2F");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      const boxSize = 130;
      const boxX = -5;
      const boxY = (ch - boxSize) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(boxX + boxSize / 2, boxY + boxSize / 2, boxSize / 2, boxSize / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(creatureImg, boxX, boxY, boxSize, boxSize);
      ctx.restore();

      ctx.fillStyle = "rgba(232,181,77,0.15)";
      drawRoundedRect(ctx, 120, 26, 110, 20, 10);
      ctx.fill();
      ctx.fillStyle = "#E8B54D";
      ctx.font = "bold 10px 'Space Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(profile.tier, 130, 40);

      ctx.fillStyle = "#F5EFE6";
      ctx.font = "bold 26px 'Space Mono', monospace";
      ctx.fillText(padId(profile.memberId), 120, 82);

      ctx.fillStyle = "#B8A9C4";
      ctx.font = "13px Inter, sans-serif";
      ctx.fillText(t.shareCardCaption, 120, 106, 180);

      ctx.font = "bold 13px 'Fraunces', serif";
      ctx.fillStyle = "#E8B54D";
      ctx.fillText("HELEN", 120, ch - 24);
      ctx.font = "11px 'Space Mono', monospace";
      ctx.fillStyle = "#B8A9C4";
      ctx.fillText("helen.app", 120, ch - 10);
    });
    return () => {
      cancelled = true;
    };
  }, [open, profile, t]);

  async function handleShareOrDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "helen-card.png", { type: "image/png" });
        await navigator.share({ files: [file], title: "HELEN" });
        return;
      } catch {
        // user cancelled or Web Share unsupported for files — fall through to download
      }
    }
    const link = document.createElement("a");
    link.download = `helen-card-${profile.memberId}.png`;
    link.href = dataUrl;
    link.click();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[340px] rounded-2xl border border-helen-gold/15 bg-helen-ink-2 p-6 text-center">
        <h3 className="mb-3.5 font-helen-display text-lg font-semibold">{t.shareCardTitle}</h3>
        <canvas ref={canvasRef} width={320} height={220} className="mb-4 w-full rounded-[10px]" />
        <button
          type="button"
          onClick={handleShareOrDownload}
          className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink"
        >
          {t.inviteBtn}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full rounded-xl border border-white/15 py-[15px] text-[14.5px] font-medium text-helen-dim"
        >
          {t.closeLabel}
        </button>
      </div>
    </div>
  );
}
