export type CoinSide = 'lion' | 'person';

const TAU = Math.PI * 2;
/** Where the coin rests: flat on the mat between the rows. */
export const COIN_REST_Y = 0.25;
/** How high it flies. */
const PEAK_Y = 2.0;
/** Whole turns for lion (the top face), half a turn more for person (the bottom face). */
const TURNS: Record<CoinSide, number> = { lion: 5, person: 5.5 };

/**
 * The coin's flight (spec §9, screen 6): up on a parabola to 2.0 and back down to rest over
 * `duration` seconds, spinning about x with an ease-out so the called face ends up, with a small
 * wobble about y that dies away. Before the start it rests; after the end it stays as it landed.
 */
export function coinSpin(t: number, lands: CoinSide, duration = 1.2): { y: number; rx: number; ry: number } {
  const k = Math.min(1, Math.max(0, t / duration));
  const eased = 1 - (1 - k) ** 3;
  return {
    y: COIN_REST_Y + (PEAK_Y - COIN_REST_Y) * 4 * k * (1 - k),
    rx: TURNS[lands] * TAU * eased,
    ry: 0.15 * Math.sin(6 * Math.PI * k) * (1 - k),
  };
}
