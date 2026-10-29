import { mulberry32 } from '@etg/gebeta-rules';

/** Where the flames are: the hearth's centre and the top of the ember bed. */
export const FLAME_BASE: [number, number, number] = [-26, -1.4, -2];

export interface EmbersState {
  /** Start positions, xyz per ember. */
  origin: Float32Array;
  /** Seconds each ember lives before it is reborn. */
  life: Float32Array;
  /** Rise speed in units per second. */
  speed: Float32Array;
  /** Size in CSS px. */
  size: Float32Array;
  /** Phase offsets, so embers are not all born at once. */
  phase: Float32Array;
}

/** Fixed per-ember numbers: born low in the flame, living 2.5–5 s, rising to about 2 m (40). */
export function embersState(count: number, seed: number): EmbersState {
  const rng = mulberry32(seed);
  const origin = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const speed = new Float32Array(count);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * 2.5;
    origin[i * 3] = FLAME_BASE[0] + r * Math.cos(a);
    origin[i * 3 + 1] = FLAME_BASE[1] + rng() * 3;
    origin[i * 3 + 2] = FLAME_BASE[2] + r * Math.sin(a);
    life[i] = 2.5 + rng() * 2.5;
    // Rise about 40 over a life, give or take.
    speed[i] = (32 + rng() * 10) / life[i]!;
    size[i] = 2 + rng() * 2;
    phase[i] = rng();
  }
  return { origin, life, speed, size, phase };
}
