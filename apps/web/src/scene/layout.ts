import type { HoleIndex, Player } from '@etg/gebeta-rules';
import { BLUEPRINT } from './board/blueprint';

// World units (p), y up: 1 p = one cup pitch = 50 mm. Player A sits at +z looking towards −z; player B
// sits at −z. A's store is at +x. The board's top face is y = 0 and the ground is under the feet.
export const HOLE_SPACING = BLUEPRINT.cups.pitch;
export const ROW_GAP = BLUEPRINT.cups.rowZ * 2;
export const HOLE_RADIUS = BLUEPRINT.cups.diameter / 2;
export const HOLE_DEPTH = BLUEPRINT.cups.depth;
export const STORE_X = BLUEPRINT.stores.x;
export const STORE_RADIUS = BLUEPRINT.stores.diameter / 2;
export const STORE_DEPTH = BLUEPRINT.stores.depth;
export const STONE_SIZE = BLUEPRINT.stones.diameter;
export const GROUND_Y = -(BLUEPRINT.body.thickness + BLUEPRINT.feet.height);

export type Vec3 = [number, number, number];

/**
 * Hole centres in sowing (counter-clockwise from above) order. A's row runs left to right as A
 * sees it, then B's row continues back the other way, which is left to right as B sees it.
 */
export function holeCenter(hole: HoleIndex): Vec3 {
  return hole < 6
    ? [-2.5 + hole * HOLE_SPACING, 0, ROW_GAP / 2]
    : [2.5 - (hole - 6) * HOLE_SPACING, 0, -ROW_GAP / 2];
}

/** Each player's store cup, at their own right-hand end of the board. */
export function storeCenter(player: Player): Vec3 {
  return [player === 0 ? STORE_X : -STORE_X, 0, 0];
}

const LIP_WIDTH = 0.3 * HOLE_RADIUS;
const LIP_HEIGHT = 0.025;

/** Height of a bowl's surface at distance `d` from its centre: a spherical cap with a low raised lip. */
export function bowlSurfaceY(d: number, radius = HOLE_RADIUS, depth = HOLE_DEPTH): number {
  if (d < radius) return -depth * Math.sqrt(1 - (d / radius) ** 2);
  if (d < radius + LIP_WIDTH) return LIP_HEIGHT * Math.sin((Math.PI * (d - radius)) / LIP_WIDTH);
  return 0;
}

/** A small deterministic number in [0, 1) for a pair of integers, for natural-looking jitter. */
export function hash2(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x27d4eb2f, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

const PER_LAYER = 7;
const RING_ANGLES = [0, 120, 240, 60, 180, 300];
const RING_RADIUS = 0.2;
const LAYER_HEIGHT = STONE_SIZE * 0.6;

/**
 * Where the `slot`-th stone in a hole rests: a centre stone and a ring of six per layer, each
 * layer a little narrower and higher, so a crowded hole heaps up instead of sinking.
 */
export function stoneSlot(hole: HoleIndex, slot: number): Vec3 {
  const [cx, , cz] = holeCenter(hole);
  const layer = Math.floor(slot / PER_LAYER);
  const k = slot % PER_LAYER;
  const r = k === 0 ? 0 : RING_RADIUS * Math.max(0.45, 1 - 0.13 * layer);
  const angle = (((RING_ANGLES[k - 1] ?? 0) + layer * 30 + hole * 17) * Math.PI) / 180;
  const x = cx + r * Math.cos(angle) + (hash2(hole, slot) - 0.5) * 0.02;
  const z = cz + r * Math.sin(angle) + (hash2(slot, hole) - 0.5) * 0.02;
  const d = Math.hypot(x - cx, z - cz);
  return [x, bowlSurfaceY(d) + STONE_SIZE * 0.45 + layer * LAYER_HEIGHT, z];
}

const STORE_PER_LAYER = 9;
const STORE_RING = 0.3;

/** Captured stones lie in their owner's store cup: a centre stone and a ring of eight per layer. */
export function storeSlot(player: Player, index: number): Vec3 {
  const [cx, , cz] = storeCenter(player);
  const layer = Math.floor(index / STORE_PER_LAYER);
  const k = index % STORE_PER_LAYER;
  const r = k === 0 ? 0 : STORE_RING * Math.max(0.5, 1 - 0.12 * layer);
  const angle = (((k - 1) * 45 + layer * 20) * Math.PI) / 180;
  // The jitter depends on the index alone, so B's store mirrors A's exactly.
  const x = cx + (r * Math.cos(angle) + (hash2(index, 50) - 0.5) * 0.03) * (player === 0 ? 1 : -1);
  const z = cz + r * Math.sin(angle) + (hash2(50, index) - 0.5) * 0.03;
  const d = Math.hypot(x - cx, z - cz);
  return [x, bowlSurfaceY(d, STORE_RADIUS, STORE_DEPTH) + STONE_SIZE * 0.45 + layer * LAYER_HEIGHT, z];
}

/** Picked-up stones hover above the hole they came from, as if held in a hand. */
export function handSlot(hole: HoleIndex, index: number): Vec3 {
  const [cx, , cz] = holeCenter(hole);
  return [cx + 0.1 * Math.cos(index * 2.4), 0.7 + Math.floor(index / 5) * 0.12, cz + 0.1 * Math.sin(index * 2.4)];
}

/**
 * Everything the camera must keep in view: the body down to the ground, and both heads with
 * their horns (the side outline, spread sideways where the horns are).
 */
export function fitPoints(): Vec3[] {
  const pts: Vec3[] = [];
  const { body, heads } = BLUEPRINT;
  const spread = heads.measures.hornSpread / 2;
  for (const s of [-1, 1]) {
    for (const [u, v] of heads.outlines.side) {
      const x = s < 0 ? -heads.x + u : heads.x - u;
      for (const z of [-1, 0, 1]) pts.push([x, v, z * (v > 1.2 ? spread : 0.3)]);
    }
  }
  for (const x of [-body.halfLength, body.halfLength]) {
    for (const z of [-body.halfWidth, body.halfWidth]) for (const y of [0, GROUND_Y]) pts.push([x, y, z]);
  }
  return pts;
}
