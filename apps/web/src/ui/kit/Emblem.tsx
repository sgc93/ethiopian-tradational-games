import { ibexPath } from './ibexPath';

/** The ibex head's side outline from the blueprint, fitted into the 56-unit crest. */
export const EMBLEM_PATH = ibexPath(29, 28, 28);

/** The crest's ring of window marks, after the row of windows along the board's carved band: 24 round the rim. */
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const r = (n: number) => Math.round(n * 100) / 100;
  return `M${r(28 + 23.2 * Math.cos(a))} ${r(28 + 23.2 * Math.sin(a))}L${r(28 + 25.4 * Math.cos(a))} ${r(28 + 25.4 * Math.sin(a))}`;
}).join('');

export interface EmblemProps {
  /** In reference px; scaled by the interface. Default 56. */
  size?: number;
  className?: string;
  /** Said by screen readers; omit where the emblem is decoration. */
  label?: string;
}

/**
 * The crest: the board's ibex head as a solid stamp inside a brass ring set with the band's
 * window marks. It stands for the game on the loading screen, the title and the result.
 */
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
      <circle className="emblem-ground" cx="28" cy="28" r="27" />
      <circle className="emblem-ring" cx="28" cy="28" r="26.6" />
      <path className="emblem-ticks" d={TICKS} />
      <circle className="emblem-ring" cx="28" cy="28" r="21.6" />
      <path className="emblem-head" d={EMBLEM_PATH} />
    </svg>
  );
}
