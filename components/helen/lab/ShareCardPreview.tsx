"use client";

import { useEffect, useRef } from "react";
import { paletteForStage } from "@/lib/helen/lab/palette";

interface ShareCardPreviewProps {
  open: boolean;
  onClose: () => void;
  stage: number;
  streak: number;
  feedsCount: number;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ShareCardPreview({ open, onClose, stage, streak, feedsCount }: ShareCardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palette = paletteForStage(stage);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const cw = 320;
    const ch = 220;
    const grad = ctx.createLinearGradient(0, 0, cw, ch);
    grad.addColorStop(0, palette.bgBlobs[0]);
    grad.addColorStop(1, palette.bgBase);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // simplified creature glyph — a filled circle with a couple of spikes,
    // enough to read as "the creature" without redrawing the full SVG generator
    const ccx = 65;
    const ccy = ch / 2;
    const r = 34 + stage * 3;
    ctx.fillStyle = palette.secondary;
    for (let i = 0; i < Math.min(stage + 1, 7); i++) {
      const angle = -Math.PI / 2 + (i - Math.min(stage, 6) / 2) * 0.35;
      const tipX = ccx + Math.cos(angle) * (r + 16);
      const tipY = ccy + Math.sin(angle) * (r + 16);
      ctx.beginPath();
      ctx.moveTo(ccx + Math.cos(angle - 0.15) * r * 0.9, ccy + Math.sin(angle - 0.15) * r * 0.9);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(ccx + Math.cos(angle + 0.15) * r * 0.9, ccy + Math.sin(angle + 0.15) * r * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = palette.primary;
    ctx.beginPath();
    ctx.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    drawRoundedRect(ctx, 120, 26, 150, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#F5EFE6";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`STAGE ${stage} / 5`, 130, 40);

    ctx.fillStyle = "#F5EFE6";
    ctx.font = "bold 22px monospace";
    ctx.fillText(`${feedsCount} feeds`, 120, 78);

    ctx.fillStyle = "#B8A9C4";
    ctx.font = "13px sans-serif";
    ctx.fillText(`🔥 ${streak}-day streak`, 120, 102);

    ctx.font = "bold 13px serif";
    ctx.fillStyle = palette.secondary;
    ctx.fillText("HELEN LAB", 120, ch - 24);
    ctx.font = "11px monospace";
    ctx.fillStyle = "#B8A9C4";
    ctx.fillText("omnimindai.app", 120, ch - 10);
  }, [open, stage, streak, feedsCount, palette]);

  async function handleShareOrDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "helen-lab-creature.png", { type: "image/png" });
        await navigator.share({ files: [file], title: "HELEN" });
        return;
      } catch {
        // cancelled or unsupported — fall through to download
      }
    }
    const link = document.createElement("a");
    link.download = `helen-lab-creature-stage-${stage}.png`;
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
      <div className="w-full max-w-[340px] rounded-2xl border border-white/15 bg-[#241B2F] p-6 text-center">
        <h3 className="mb-1 font-helen-display text-lg font-semibold text-helen-paper">Level up! 🎉</h3>
        <p className="mb-3.5 text-xs text-helen-dim">Your creature reached stage {stage}</p>
        <canvas ref={canvasRef} width={320} height={220} className="mb-4 w-full rounded-[10px]" />
        <button
          type="button"
          onClick={handleShareOrDownload}
          className="w-full rounded-xl bg-helen-coral py-[15px] text-[14.5px] font-bold text-helen-ink"
        >
          Share
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2.5 w-full rounded-xl border border-white/15 py-[15px] text-[14.5px] font-medium text-helen-dim"
        >
          Close
        </button>
      </div>
    </div>
  );
}
