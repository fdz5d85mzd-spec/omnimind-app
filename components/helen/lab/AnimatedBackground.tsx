"use client";

import { paletteForStage } from "@/lib/helen/lab/palette";

interface AnimatedBackgroundProps {
  stage: number;
  reducedMotion: boolean;
}

/**
 * Pure CSS transform-based animated gradient mesh — three blurred blobs
 * floating on independent loops. Transform/opacity only (no background-
 * position or filter animation) so it stays on the compositor thread and
 * costs near-nothing on battery/mobile, unlike a WebGL shader.
 */
export function AnimatedBackground({ stage, reducedMotion }: AnimatedBackgroundProps) {
  const palette = paletteForStage(stage);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-[1500ms]"
      style={{ background: palette.bgBase }}
    >
      {palette.bgBlobs.map((color, i) => (
        <div
          key={i}
          className={reducedMotion ? "" : `helen-lab-blob helen-lab-blob-${i + 1}`}
          style={{
            position: "absolute",
            width: "60vmax",
            height: "60vmax",
            borderRadius: "50%",
            background: color,
            filter: "blur(60px)",
            opacity: 0.75,
            left: `${[10, 55, 30][i]}%`,
            top: `${[15, 40, 60][i]}%`,
            transition: "background 1500ms ease",
          }}
        />
      ))}
      {/* subtle vignette so foreground UI stays readable at every stage */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 40%, transparent 0%, rgba(0,0,0,0.35) 100%)" }}
      />
    </div>
  );
}
