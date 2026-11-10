import type { PostLevel } from './tiers';

export type PostEffect = 'smaa' | 'bloom' | 'depth-of-field' | 'tone-mapping' | 'grain' | 'vignette';

/**
 * The effects of a post level, in the order they run (spec §8 "Post-processing").
 *
 * Bloom and depth of field gather light, so they work on the scene's unmapped values. Tone
 * mapping comes next: the effect composer switches the renderer's own tone mapping off while it
 * is mounted, so without this step the tiers with a composer would show clipped, unmapped
 * colour and only the minimal tier a tone curve. Grain and the vignette are film effects and
 * work on the mapped picture. The night scene's colour grade (`gradeEffect.ts`: teal shadows,
 * amber highlights) is left out of the daylight studio, where the wood should show its own colour.
 *
 * The curve is the Khronos Neutral one on every tier (`Post.tsx` here, the renderer's in
 * `SceneRoot.tsx` for the minimal tier), not the spec's AgX. Under a composer nothing can skip
 * tone mapping, and the flame, the embers, the sky and the glowing rings are authored as the
 * colours they should show. AgX drains bright saturated colour by design: it turned the fire
 * pale pink and the ember rings peach. Neutral leaves in-range colours as they are and only
 * rolls the highlights off.
 */
export function postEffects(level: PostLevel): PostEffect[] {
  if (level === 'none') return [];
  const full = level === 'full';
  return [...(full ? (['smaa'] as const) : []), 'bloom', ...(full ? (['depth-of-field'] as const) : []), 'tone-mapping', 'grain', 'vignette'];
}

/** What the lens is focused on: the board's centre, the play camera's target, in every view. */
export const BOARD_FOCUS: [number, number, number] = [0, 0.4, 0];

/**
 * How far, in world units, a point's distance from the camera may differ from the focus distance
 * before it is fully blurred. Wide enough that the whole board and its heads stay sharp from any
 * camera; the hut and the trees, 150 units and more away, are fully soft.
 */
export const FOCUS_RANGE = 30;

/** How blurred (0 to 1) a point is whose camera distance is `offset` units off the focus: the lens effect's own curve. */
export function focusBlur(offset: number): number {
  const t = Math.min(1, Math.max(0, Math.abs(offset) / FOCUS_RANGE));
  return t * t * (3 - 2 * t);
}

/** The fire's shadows are this soft, in texels of the large (1024) shadow map. */
const SHADOW_SOFTNESS = 2.5;

/**
 * The shadow sampling radius for a shadow map of this size, so an edge is as soft on the low
 * tier's 512 map as on the 1024 one. three's percentage-closer shadows scatter their samples
 * over this radius; the separate "soft" type the scene used to ask for is gone from three r186,
 * which substitutes this one with a warning.
 */
export function shadowRadius(mapSize: number): number {
  return (SHADOW_SOFTNESS * mapSize) / 1024;
}
