import type { HoleIndex, Player } from '@etg/gebeta-rules';
import * as THREE from 'three';

// World units, y up. Player A sits at +z looking towards −z; player B sits at −z.
export const HOLE_SPACING = 1.0;
export const ROW_GAP = 1.15;
export const HOLE_RADIUS = 0.4;
export const HOLE_DEPTH = 0.22;
export const STONE_SIZE = 0.11;

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

const LIP_WIDTH = 0.3 * HOLE_RADIUS;
const LIP_HEIGHT = 0.025;

/** Height of the earth at distance `d` from a hole centre: a scooped bowl with a low raised lip. */
export function bowlSurfaceY(d: number): number {
  if (d < HOLE_RADIUS) return -HOLE_DEPTH * Math.sqrt(1 - (d / HOLE_RADIUS) ** 2);
  if (d < HOLE_RADIUS + LIP_WIDTH) return LIP_HEIGHT * Math.sin((Math.PI * (d - HOLE_RADIUS)) / LIP_WIDTH);
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
const RING_RADIUS = 0.12;

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
  return [x, bowlSurfaceY(d) + STONE_SIZE * 0.5 + layer * STONE_SIZE * 0.75, z];
}

const PILE_Z = ROW_GAP / 2 + 0.95;
const GROUP_STEP = 0.44;

/** Captured stones lie on the ground beside their player's row, in groups of four (homes). */
export function pileSlot(player: Player, index: number): Vec3 {
  const group = Math.floor(index / 4);
  const k = index % 4;
  const gx = -2.42 + group * GROUP_STEP + (k % 2 ? 0.05 : -0.05);
  const gz = PILE_Z + (k < 2 ? -0.05 : 0.05);
  // Mirrored for B, so each player's pile starts at their own left.
  return player === 0 ? [gx, STONE_SIZE * 0.42, gz] : [-gx, STONE_SIZE * 0.42, -gz];
}

/** Picked-up stones hover above the hole they came from, as if held in a hand. */
export function handSlot(hole: HoleIndex, index: number): Vec3 {
  const [cx, , cz] = holeCenter(hole);
  return [cx + 0.07 * Math.cos(index * 2.4), 0.5 + Math.floor(index / 5) * 0.07, cz + 0.07 * Math.sin(index * 2.4)];
}

/** The corners of everything that must stay in view: both rows, the piles, and a heap's height. */
export function boardCorners(): Vec3[] {
  const corners: Vec3[] = [];
  for (const x of [-2.95, 2.95]) for (const z of [-1.65, 1.65]) for (const y of [0, 0.3]) corners.push([x, y, z]);
  return corners;
}

const ELEVATION = (52 * Math.PI) / 180;
const MARGIN = 0.9;

/** Camera for a player's seat: behind their row, looking down at the board, close enough to fill the view. */
export function seatCamera(player: Player, aspect: number): { position: Vec3; target: Vec3; fov: number } {
  const fov = aspect < 1 ? 55 : 40;
  const sign = player === 0 ? 1 : -1;
  const target: Vec3 = [0, -0.05, 0];
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
  const v = new THREE.Vector3();
  let position: Vec3 = [0, 0, 0];
  for (let d = 3; d < 60; d += 0.25) {
    position = [0, d * Math.sin(ELEVATION), sign * d * Math.cos(ELEVATION)];
    cam.position.set(...position);
    cam.lookAt(...target);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const fits = boardCorners().every((c) => {
      v.set(...c).project(cam);
      return Math.abs(v.x) <= MARGIN && Math.abs(v.y) <= MARGIN;
    });
    if (fits) break;
  }
  return { position, target, fov };
}
