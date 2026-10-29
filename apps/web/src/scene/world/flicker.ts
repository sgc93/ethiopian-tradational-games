import type { Vec3 } from '../layout';

const TAU = Math.PI * 2;

/**
 * The fire's brightness over time: 0.85 + 0.15·n, where n mixes three sines (7.3, 11.1 and
 * 17.9 Hz) under a slow 0.6 Hz swell, so the light flickers fast but also breathes.
 */
export function flicker(t: number): number {
  const fast = 0.5 * Math.sin(TAU * 7.3 * t) + 0.3 * Math.sin(TAU * 11.1 * t + 1.3) + 0.2 * Math.sin(TAU * 17.9 * t + 2.1);
  const swell = 0.8 + 0.2 * Math.sin(TAU * 0.6 * t);
  const n = (0.5 + 0.5 * fast) * swell; // in [0, 1]
  return 0.85 + 0.15 * n;
}

/** A small wander of the flame's centre, within ±0.3 on each axis. */
export function jitter(t: number, seed: number): Vec3 {
  const s = seed * 1.7;
  return [
    0.3 * Math.sin(TAU * 5.1 * t + s) * Math.sin(TAU * 0.9 * t),
    0.3 * Math.sin(TAU * 6.7 * t + s * 2) * Math.sin(TAU * 1.3 * t + 1),
    0.3 * Math.sin(TAU * 4.3 * t + s * 3) * Math.sin(TAU * 0.7 * t + 2),
  ];
}
