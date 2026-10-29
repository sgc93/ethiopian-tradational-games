import type { Detail } from './board/bodyGeometry';

export type Tier = 'high' | 'mid' | 'low' | 'minimal';
export type PostLevel = 'full' | 'full-no-dof' | 'light' | 'none';

export interface TierSettings {
  /** Pixel density; the high tier takes the device's, up to 2. */
  dpr: number;
  shadowMap: number;
  /** The board's shadow on the mat is a texture rather than a shadow map. */
  bakedShadow: boolean;
  post: PostLevel;
  grass: number;
  embers: number;
  smoke: number;
  detail: Detail;
  /** The draw-call target, for the builder's checks. */
  drawCalls: number;
}

/** The four quality tiers of spec §11. */
export const TIERS: Record<Tier, TierSettings> = {
  high: { dpr: 2, shadowMap: 1024, bakedShadow: false, post: 'full', grass: 3000, embers: 160, smoke: 14, detail: 'full', drawCalls: 120 },
  mid: { dpr: 1.5, shadowMap: 1024, bakedShadow: false, post: 'full-no-dof', grass: 1500, embers: 90, smoke: 10, detail: 'full', drawCalls: 100 },
  low: { dpr: 1, shadowMap: 512, bakedShadow: false, post: 'light', grass: 0, embers: 40, smoke: 6, detail: 'half', drawCalls: 80 },
  minimal: { dpr: 0.85, shadowMap: 0, bakedShadow: true, post: 'none', grass: 0, embers: 24, smoke: 4, detail: 'half', drawCalls: 60 },
};

const ORDER: readonly Tier[] = ['minimal', 'low', 'mid', 'high'];
const STEP_DOWN_BELOW = 28;
const STEP_UP_ABOVE = 55;
const MIN_SAMPLES = 60;
const KEY = 'gebeta.tier';

/** One step down below 28 fps, one step up above 55, otherwise the same; never past the ends. */
export function nextTier(current: Tier, medianFps: number): Tier {
  const i = ORDER.indexOf(current);
  if (medianFps < STEP_DOWN_BELOW) return ORDER[Math.max(0, i - 1)]!;
  if (medianFps > STEP_UP_ABOVE) return ORDER[Math.min(ORDER.length - 1, i + 1)]!;
  return current;
}

export function median(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * The tier to use after a measurement: frame times in ms, taken while the page was `visibility`.
 * A hidden tab's throttled frames and a short sample never change the tier.
 */
export function decide(current: Tier, frameMs: readonly number[], visibility: DocumentVisibilityState): Tier {
  if (visibility !== 'visible' || frameMs.length < MIN_SAMPLES) return current;
  const fps = 1000 / Math.max(0.001, median(frameMs));
  return nextTier(current, fps);
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** The remembered tier, or null when there is none or storage is unavailable. */
export function readStoredTier(storage: Pick<Storage, 'getItem'> | null): Tier | null {
  try {
    const v = storage?.getItem(KEY);
    return ORDER.find((t) => t === v) ?? null;
  } catch {
    return null;
  }
}

export function storeTier(storage: StorageLike | null, tier: Tier): void {
  try {
    storage?.setItem(KEY, tier);
  } catch {
    // Private mode or a full quota: the tier is simply measured again next time.
  }
}
