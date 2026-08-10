export interface StageShapeConfig {
  bodyR: number;
  spikes: number;
  spikeLen: number;
  spikeWidth: number;
  hasArms: boolean;
  hasLegs: boolean;
  sparkles: boolean;
}

export const STAGE_SHAPES: StageShapeConfig[] = [
  { bodyR: 40, spikes: 0, spikeLen: 0, spikeWidth: 0, hasArms: false, hasLegs: false, sparkles: false },
  { bodyR: 50, spikes: 3, spikeLen: 16, spikeWidth: 11, hasArms: false, hasLegs: false, sparkles: false },
  { bodyR: 60, spikes: 5, spikeLen: 20, spikeWidth: 10, hasArms: true, hasLegs: false, sparkles: false },
  { bodyR: 70, spikes: 7, spikeLen: 26, spikeWidth: 9, hasArms: true, hasLegs: true, sparkles: false },
  { bodyR: 80, spikes: 9, spikeLen: 32, spikeWidth: 8, hasArms: true, hasLegs: true, sparkles: true },
];

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** A single flame-like spike as a closed SVG path, base sitting on the body circle. */
export function spikePath(cx: number, cy: number, bodyR: number, angleDeg: number, length: number, width: number): string {
  const [tipX, tipY] = polar(cx, cy, bodyR + length, angleDeg);
  const [leftX, leftY] = polar(cx, cy, bodyR * 0.9, angleDeg - width);
  const [rightX, rightY] = polar(cx, cy, bodyR * 0.9, angleDeg + width);
  const c1x = cx + (tipX - cx) * 0.35;
  const c1y = cy + (tipY - cy) * 0.35;
  return `M ${leftX} ${leftY} Q ${c1x} ${c1y} ${tipX} ${tipY} Q ${c1x} ${c1y} ${rightX} ${rightY} Z`;
}

/** Evenly spaced spike angles across the top arc of the body (like a sunrise crown). */
export function spikeAngles(count: number): number[] {
  if (count === 0) return [];
  const spread = 140; // degrees, centered on top (0deg = straight up)
  const start = -spread / 2;
  const step = count > 1 ? spread / (count - 1) : 0;
  return Array.from({ length: count }, (_, i) => start + i * step);
}
