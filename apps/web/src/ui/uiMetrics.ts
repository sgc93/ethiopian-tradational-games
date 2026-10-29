import type { Bands } from '../scene/camera/poses';

export interface UiMetrics {
  /** Everything in the interface is multiplied by this: clamp(0.82, height / 390, 1.6). */
  scale: number;
  /** Below 340 px tall: smaller plates, cartouche and discs, and 44 px bands. */
  compact: boolean;
  /** The interface bands in CSS px, for the play camera's fit. */
  bands: Bands;
  width: number;
  height: number;
}

const REFERENCE_HEIGHT = 390;
const COMPACT_BELOW = 340;

/** The interface's scale, layout and bands for a visible viewport (spec §9, scale and safe areas). */
export function uiMetrics(width: number, height: number): UiMetrics {
  const scale = Math.min(1.6, Math.max(0.82, height / REFERENCE_HEIGHT));
  const compact = height < COMPACT_BELOW;
  const top = (compact ? 44 : 56) * scale;
  const bottom = height - (compact ? 56 : 77) * scale;
  return { scale, compact, bands: { top, bottom }, width, height };
}
