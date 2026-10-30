/** The feedback curves (spec §7 "Game feedback in the world"), pure so they can be checked. */

const TAU = Math.PI * 2;

/** A playable cup's ring: 40–100% every 1.6 s. */
export function ringPulse(t: number, period = 1.6): number {
  return Math.min(1, Math.max(0.4, 0.7 + 0.3 * Math.sin((TAU * t) / period)));
}

/** The suggested cup in a lesson pulses brighter and faster: 60–100% every second. */
export function suggestedPulse(t: number): number {
  return 0.8 + 0.2 * Math.sin(TAU * t);
}

/** A press tightens the ring by 4%. */
export const pressScale = 0.96;

/** The firelight's swell at a turn change: up about 10% and back over 0.8 s. */
export function turnSwell(age: number): number {
  if (age < 0 || age >= 0.8) return 1;
  return 1 + 0.1 * Math.sin((Math.PI * age) / 0.8);
}

/** The camera's ease towards a captured cup: 3% at the peak, over half a second. */
export function nudge(age: number): number {
  if (age < 0 || age >= 0.5) return 0;
  return 0.03 * Math.sin((Math.PI * age) / 0.5);
}
