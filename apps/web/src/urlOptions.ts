import type { Speed } from './state/settings';

export type TierName = 'high' | 'mid' | 'low' | 'minimal';
const TIERS: readonly TierName[] = ['high', 'mid', 'low', 'minimal'];

/**
 * Test-only switches read from the address: `?speed=skip` forces skip speed, `?seed=N` makes
 * the coin and the computer's choices repeatable, `?tier=low` fixes the performance tier, and
 * `?cam=home` holds the camera by the fire for looking at the set. None of them touches saved settings.
 */
function read(): { speed?: Speed; seed?: number; tier?: TierName; cam?: 'home'; still?: boolean } {
  if (typeof location === 'undefined') return {};
  const q = new URLSearchParams(location.search);
  const seed = Number(q.get('seed'));
  const tier = q.get('tier');
  return {
    speed: q.get('speed') === 'skip' ? 'skip' : undefined,
    seed: q.has('seed') && Number.isFinite(seed) ? seed : undefined,
    tier: TIERS.find((t) => t === tier),
    cam: q.get('cam') === 'home' ? 'home' : undefined,
    // `?still=1` freezes the home camera at t = 12 s and hides the interface: for the no-WebGL still.
    still: q.get('still') === '1' ? true : undefined,
  };
}

export const urlOptions = read();
