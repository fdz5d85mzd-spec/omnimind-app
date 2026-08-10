export interface StagePalette {
  /** Body fill color */
  primary: string;
  /** Spikes / accent color */
  secondary: string;
  /** Background base tones (dark, for the animated gradient blobs) */
  bgBlobs: [string, string, string];
  bgBase: string;
  glow: string;
}

/** Warm (stage 1) -> cosmic aurora (stage 5), matching the creature's own accent color. */
export const STAGE_PALETTES: StagePalette[] = [
  {
    primary: "#F2795C",
    secondary: "#F2B84D",
    bgBlobs: ["#3a2418", "#4a2e1a", "#2a1a20"],
    bgBase: "#1c1216",
    glow: "#F2795C",
  },
  {
    primary: "#E8B54D",
    secondary: "#F2795C",
    bgBlobs: ["#3a2e14", "#4a3a1a", "#2e2416"],
    bgBase: "#1c1710",
    glow: "#E8B54D",
  },
  {
    primary: "#8FAE72",
    secondary: "#4DA6A0",
    bgBlobs: ["#1f3324", "#1a3a34", "#243a1f"],
    bgBase: "#0f1a14",
    glow: "#8FAE72",
  },
  {
    primary: "#6C7CFF",
    secondary: "#4DA6E8",
    bgBlobs: ["#1a1f3a", "#1a2e4a", "#241a3a"],
    bgBase: "#0d0f1c",
    glow: "#6C7CFF",
  },
  {
    primary: "#B463FF",
    secondary: "#4DEFD0",
    bgBlobs: ["#2a1a3a", "#1a3a36", "#3a1a44"],
    bgBase: "#0c0a1a",
    glow: "#B463FF",
  },
];

export function paletteForStage(stage: number): StagePalette {
  return STAGE_PALETTES[Math.min(Math.max(stage, 1), STAGE_PALETTES.length) - 1];
}
