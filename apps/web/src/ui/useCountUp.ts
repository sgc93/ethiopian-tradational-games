import { useEffect, useState } from 'react';
import { deviceEnv } from '../state/settings';

/** The value shown a share `k` (0 to 1) of the way through a count-up: quick at first, easing into the total. */
export function countAt(total: number, k: number): number {
  if (k >= 1) return total;
  if (k <= 0) return 0;
  return Math.round(total * (1 - Math.pow(1 - k, 3)));
}

/**
 * A number that counts up to `total` over `ms`, after `delayMs`: for a score that should arrive
 * rather than appear. With reduced motion, and where there is no animation frame, it is the total at once.
 */
export function useCountUp(total: number, ms = 900, delayMs = 0): number {
  const still = typeof requestAnimationFrame === 'undefined' || deviceEnv().reducedMotion || ms <= 0;
  const [shown, setShown] = useState(still ? total : 0);
  useEffect(() => {
    if (still) {
      setShown(total);
      return;
    }
    let frame = 0;
    const start = performance.now() + delayMs;
    const tick = () => {
      const k = (performance.now() - start) / ms;
      setShown(countAt(total, k));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total, ms, delayMs, still]);
  return shown;
}
