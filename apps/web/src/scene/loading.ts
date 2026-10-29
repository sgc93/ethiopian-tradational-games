/** The loading screen's arithmetic (spec §9, screen 1): pure, so the screen itself stays thin. */

/** Anything with localStorage's shape; the real one can throw (private mode, quota). */
export interface VisitStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const VISITED_KEY = 'gebeta.visited';

/** Texture download is most of the wait; the board build and the fonts are the rest. */
export function loadingState(progress: number, geometryReady: boolean, fontsReady: boolean): number {
  const p = Math.min(1, Math.max(0, progress));
  // In tenths, so that everything ready is exactly 1 and not 0.9999….
  return (7 * p + (geometryReady ? 2 : 0) + (fontsReady ? 1 : 0)) / 10;
}

export function hasVisited(storage: VisitStorage): boolean {
  try {
    return storage.getItem(VISITED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markVisited(storage: VisitStorage): void {
  try {
    storage.setItem(VISITED_KEY, '1');
  } catch {
    /* no memory of the visit, so the next one flares long again: harmless */
  }
}

/** How long the fire takes to flare: a slow reveal the first time, a short one after. */
export const FIRST_FLARE_S = 2.4;
export const RETURN_FLARE_S = 0.8;

/** The fire's light, 0 → 1 over `duration` seconds with ease-out cubic. */
export function flareCurve(t: number, duration: number): number {
  if (duration <= 0 || t >= duration) return 1;
  if (t <= 0) return 0;
  const x = t / duration;
  return 1 - Math.pow(1 - x, 3);
}
