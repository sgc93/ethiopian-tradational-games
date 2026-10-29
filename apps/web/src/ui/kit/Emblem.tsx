import { BLUEPRINT } from '../../scene/board/blueprint';

/** The ibex head's side outline from the blueprint, fitted into the 56-unit medallion. */
function outlinePath(): string {
  const points = BLUEPRINT.heads.outlines.side;
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const [u, v] of points) {
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }
  const box = 31;
  const s = box / Math.max(maxU - minU, maxV - minV);
  const cu = (minU + maxU) / 2;
  const cv = (minV + maxV) / 2;
  const r = (n: number) => Math.round(n * 100) / 100;
  return points.map(([u, v], i) => `${i === 0 ? 'M' : 'L'}${r(28 + (u - cu) * s)} ${r(28 - (v - cv) * s)}`).join('') + 'Z';
}

export const EMBLEM_PATH = outlinePath();

export interface EmblemProps {
  /** In reference px; scaled by the interface. Default 56. */
  size?: number;
  className?: string;
  /** Said by screen readers; omit where the emblem is decoration. */
  label?: string;
}

/** The ibex-head medallion: two rings and the head drawn as a vector from the blueprint (spec §9 "Emblem"). */
export function Emblem({ size = 56, className, label }: EmblemProps) {
  return (
    <svg
      className={className ? `emblem ${className}` : 'emblem'}
      viewBox="0 0 56 56"
      style={{ width: `calc(${size}px * var(--ui))`, height: `calc(${size}px * var(--ui))` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <circle cx="28" cy="28" r="26" />
      <circle cx="28" cy="28" r="22" style={{ opacity: 0.35 }} />
      <path d={EMBLEM_PATH} />
    </svg>
  );
}
