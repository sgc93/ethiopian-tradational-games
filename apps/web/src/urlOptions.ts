import type { Speed } from './state/settings';

/**
 * Test-only switches read from the address: `?speed=skip` forces skip speed and `?seed=N` makes
 * the coin and the computer's choices repeatable. Neither touches saved settings.
 */
function read(): { speed?: Speed; seed?: number } {
  if (typeof location === 'undefined') return {};
  const q = new URLSearchParams(location.search);
  const seed = Number(q.get('seed'));
  return {
    speed: q.get('speed') === 'skip' ? 'skip' : undefined,
    seed: q.has('seed') && Number.isFinite(seed) ? seed : undefined,
  };
}

export const urlOptions = read();
