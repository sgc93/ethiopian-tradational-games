import { HOLES, type HoleIndex, type Player } from '@etg/gebeta-rules';
import { project, type Pose, type Size } from '../../scene/camera/poses';
import { holeCenter, storeCenter, type Vec3 } from '../../scene/layout';

/** Fourteen discs: the twelve cups in sowing order, then store A (12) and store B (13). */
export const DISCS = HOLES + 2;

/** How far outside a cup's centre its disc sits, in world units (a cup pitch is 1). */
const CUP_OFFSET = 0.6;
/** The stores' discs sit over their far rim, as the seated player sees it. */
const STORE_OFFSET = 0.45;

/**
 * Where a count disc is anchored in the world, for the seat the camera sits behind: the near
 * row's discs just outside its cups, the far row's just beyond, the stores' over their far rim
 * (spec §9 "Count disc"; `docs/design/scene/tools/boardview.mjs`).
 */
export function discAnchor(index: number, seat: Player = 0): Vec3 {
  const sign = seat === 0 ? 1 : -1;
  if (index < HOLES) {
    const [x, , z] = holeCenter(index as HoleIndex);
    return [x, 0, z + (z > 0 ? CUP_OFFSET : -CUP_OFFSET)];
  }
  const [x] = storeCenter((index - HOLES) as Player);
  return [x, 0, -STORE_OFFSET * sign];
}

/** A disc's anchor on screen for a camera pose, in CSS px from the top-left. */
export function discScreen(pose: Pose, size: Size, index: number, seat: Player = 0): [number, number] {
  return project(pose, size, discAnchor(index, seat));
}
