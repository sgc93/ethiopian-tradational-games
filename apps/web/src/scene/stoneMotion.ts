import type { Vec3 } from './layout';

/**
 * How a stone moves, by what is happening to it:
 * - `lift`: picked up out of a cup into the hand, with a little pop at the top;
 * - `carry`: held in the hand as it travels to the next cup, in a low hop;
 * - `drop`: tossed from the hand into a cup, falling faster as it goes, with one small bounce;
 * - `capture`: lifted, swirled once and sent in a high arc to the store;
 * - `deal`: thrown in a high arc (the sweep at a round's end and the deal at the next one's start), with a bounce.
 */
export type Motion = 'lift' | 'carry' | 'drop' | 'capture' | 'deal';

export interface Flight {
  position: Vec3;
  /** How far the stone has turned from its resting angle, in radians; 0 at both ends of a move. */
  spin: number;
}

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outQuad = (t: number) => 1 - (1 - t) * (1 - t);
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const inOutSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
/** Runs a little past 1 and settles back: the pop of something lifted briskly. */
const outBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/** The share of a falling move spent in the air; the rest is the bounce. */
const AIR = 0.8;

/**
 * Where a stone is and how far it has turned, a share `k` (0 to 1) of the way through a move
 * from `from` to `to`. It tumbles `turns` whole turns on the way, so it leaves and arrives at its
 * own resting angle. At `k = 1` it is exactly at `to`.
 */
export function flight(kind: Motion, from: Vec3, to: Vec3, k: number, turns = 0): Flight {
  if (k <= 0) return { position: from, spin: 0 };
  if (k >= 1) return { position: to, spin: 0 };
  switch (kind) {
    case 'lift':
      return { position: mix(from, to, outBack(k)), spin: turns * TAU * (1 - outCubic(k)) };
    case 'carry': {
      const p = mix(from, to, inOutSine(k));
      p[1] += 0.12 * Math.sin(Math.PI * k);
      return { position: p, spin: 0 };
    }
    case 'drop': {
      if (k >= AIR) {
        const b = (k - AIR) / (1 - AIR);
        return { position: [to[0], to[1] + 0.06 * Math.sin(Math.PI * b), to[2]], spin: 0 };
      }
      const u = k / AIR;
      const h = outQuad(u);
      // A short rise as it leaves the hand, then a fall that gathers speed.
      const y = lerp(from[1], to[1], u * u) + 0.2 * Math.sin(Math.PI * u) * (1 - u);
      return { position: [lerp(from[0], to[0], h), y, lerp(from[2], to[2], h)], spin: turns * TAU * (1 - u) };
    }
    case 'capture': {
      const RISE = 0.3;
      const top: Vec3 = [from[0], from[1] + 0.65, from[2]];
      if (k < RISE) {
        const u = outCubic(k / RISE);
        const swirl = 0.12 * Math.sin(Math.PI * u);
        return { position: [lerp(from[0], top[0], u) + swirl * Math.cos(u * TAU), lerp(from[1], top[1], u), lerp(from[2], top[2], u) + swirl * Math.sin(u * TAU)], spin: turns * TAU * (1 - k) };
      }
      const e = inOutCubic((k - RISE) / (1 - RISE));
      const p = mix(top, to, e);
      p[1] += 0.9 * Math.sin(Math.PI * e) * (1 - e * 0.35);
      return { position: p, spin: turns * TAU * (1 - k) };
    }
    case 'deal': {
      if (k >= AIR) {
        const b = (k - AIR) / (1 - AIR);
        return { position: [to[0], to[1] + 0.08 * Math.sin(Math.PI * b), to[2]], spin: 0 };
      }
      const u = k / AIR;
      const p = mix(from, to, inOutSine(u));
      p[1] += 0.9 * 4 * u * (1 - u);
      return { position: p, spin: turns * TAU * (1 - u) };
    }
  }
}
