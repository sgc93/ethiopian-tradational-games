import { useUiMetrics } from './useUiMetrics';

/** Taller than wide: the game shows "turn your phone" instead of the board (spec §9 "Turn your phone"). */
export function isPortrait(width: number, height: number): boolean {
  return height > width;
}

/** Whether the visible viewport is portrait right now; follows the same resizes as the interface scale. */
export function usePortrait(): boolean {
  const { width, height } = useUiMetrics();
  return isPortrait(width, height);
}
