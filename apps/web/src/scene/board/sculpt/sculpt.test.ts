import { expect, test } from 'vitest';
import { BLUEPRINT } from '../blueprint';
import { buildHorn, hornCentre, hornKnob } from './horn';
import { earSdf, headBounds, headHalfWidth, headProfile, headSdf, PROFILE, type V3 } from './sdf';

const bp = BLUEPRINT;
const head = (p: V3) => headSdf(bp, p);

/** Walks from a point along an axis until the surface is crossed; the surface's coordinate there. */
function surface(f: (p: V3) => number, from: V3, axis: 0 | 1 | 2, dir: 1 | -1, max = 4): number | null {
  const p: V3 = [...from];
  const step = 0.004;
  const inside = f(p) < 0;
  for (let s = 0; s < max; s += step) {
    p[axis] = from[axis] + dir * s;
    if (f(p) < 0 !== inside) return p[axis];
  }
  return null;
}

test('the head is solid at its core and empty around it', () => {
  expect(head([0, 0.8, 0])).toBeLessThan(0); // inside the neck
  expect(head([0.6, 1.7, 0])).toBeLessThan(0); // inside the skull
  expect(head([0, 0.8, 1.2])).toBeGreaterThan(0); // beside the neck
  expect(head([2.0, 1.0, 0])).toBeGreaterThan(0); // in front of the nose
  expect(head([0, 3.0, 0])).toBeGreaterThan(0); // above the head
});

test('seen from the side, the head is the traced outline', () => {
  const { muzzle } = bp.heads.measures;
  // The nose reaches the blueprint's muzzle length.
  const nose = surface(head, [1.0, 1.0, 0], 0, 1)!;
  expect(Math.abs(nose - muzzle)).toBeLessThan(0.05);
  // The back of the neck and the throat follow the outline at mid-height.
  expect(Math.abs(surface(head, [0, 1.0, 0], 0, -1)! - -0.36)).toBeLessThan(0.05);
  expect(Math.abs(surface(head, [0, 0.6, 0], 0, 1)! - 0.66)).toBeLessThan(0.05);
  // The crown, under the horns, is the outline's top.
  expect(Math.abs(surface(head, [0.8, 1.6, 0], 1, 1)! - 2.035)).toBeLessThan(0.05);
  // The foot is cut flat, sunk a little into the board.
  expect(head([0, -PROFILE.footSink + 0.01, 0])).toBeLessThan(0);
  expect(head([0, -PROFILE.footSink - 0.01, 0])).toBeGreaterThan(0);
});

test('the inflated profile leaves the ear out, for the ear is a leaf of its own', () => {
  const profile = headProfile(bp);
  expect(profile.every(([u, v]) => !(v > 2.06 && u < 0.53))).toBe(true);
  const e = PROFILE.ear;
  const mid: V3 = [(e.base[0] + e.tip[0]) / 2, (e.base[1] + e.tip[1]) / 2, (e.base[2] + e.tip[2]) / 2];
  expect(earSdf(mid, 1)).toBeLessThan(0);
  expect(earSdf([mid[0], mid[1], -mid[2]], -1)).toBeLessThan(0);
  expect(head(mid)).toBeLessThan(0); // and the head carries it
  const nearTip: V3 = [e.tip[0] * 0.9 + e.base[0] * 0.1, e.tip[1] * 0.9 + e.base[1] * 0.1, e.tip[2] * 0.9 + e.base[2] * 0.1];
  expect(head(nearTip)).toBeLessThan(0.02);
});

test('seen from the front, the neck is as stout as the carving, not the blueprint’s thin outline', () => {
  const side = surface(head, [0, 0.725, 0], 2, 1)!;
  expect(side).toBeGreaterThan(0.38);
  expect(side).toBeLessThan(0.5);
  const foot = surface(head, [0, 0.05, 0], 2, 1)!;
  expect(foot).toBeGreaterThan(side);
  // The muzzle is narrow against the skull.
  expect(surface(head, [1.45, 1.1, 0], 2, 1)!).toBeLessThan(0.2);
  expect(surface(head, [0.75, 1.66, 0], 2, 1)!).toBeGreaterThan(0.35);
});

test('the eyes, nostrils, mouth and beard are cut into the head', () => {
  const { eye, nostril, mouth } = PROFILE;
  // The eye is an opening: each lid stands proud of the ball just inside it.
  const at = (dv: number) => headHalfWidth(bp, eye.u, eye.v + dv);
  const upper = eye.halfHeight + 0.003;
  expect(at(upper)).toBeGreaterThan(at(upper - 0.012) + 0.005);
  const lower = -eye.halfHeight - 0.015;
  expect(at(lower)).toBeGreaterThan(at(lower + 0.024) + 0.003);
  // A nostril is a hollow in the side of the nose.
  const hollow = surface(head, [nostril.u, nostril.v, 0], 2, 1)!;
  const below = surface(head, [nostril.u, nostril.v - 0.05, 0], 2, 1)!;
  expect(hollow).toBeLessThan(below - 0.02);
  // The mouth is a cut line.
  const [mu, mv] = mouth[1]!;
  expect(headHalfWidth(bp, mu, mv)).toBeLessThan(headHalfWidth(bp, mu, mv + 0.05));
  // The beard hangs below the chin, narrower than the jaw.
  const beard = surface(head, [1.15, 0.65, 0], 2, 1)!;
  expect(beard).toBeGreaterThan(0.04);
  expect(beard).toBeLessThan(0.17);
});

const FULL = { sides: 16, perRidge: 6, step: 0.01 };

test('the horns rise close together, swing out to a lyre and turn their tips back in', () => {
  const root = hornCentre(bp, 1, 0);
  const widest = Math.max(...Array.from({ length: 101 }, (_, i) => hornCentre(bp, 1, i / 100)[2]));
  const tip = hornCentre(bp, 1, 1);
  expect(root[2]).toBeLessThan(0.25);
  expect(widest).toBeGreaterThan(1.25);
  expect(tip[2]).toBeLessThan(widest - 0.3);
  expect(hornCentre(bp, -1, 0.6)[2]).toBeCloseTo(-hornCentre(bp, 1, 0.6)[2], 6);
  // The side-view path is the blueprint's.
  const s = bp.heads.horn.stations[20]!;
  const c = hornCentre(bp, 1, s.t);
  expect(Math.hypot(c[0] - s.u, c[1] - s.v)).toBeLessThan(1e-3);
});

test('the ridges are knuckles with narrow valleys between', () => {
  const list = bp.heads.horn.ridges.list;
  expect(hornKnob(bp, list[5]!.t)).toBeGreaterThan(0.06);
  expect(hornKnob(bp, (list[5]!.t + list[6]!.t) / 2)).toBeLessThan(0.01);
});

test('a horn grows out of the skull, within its budget, and nothing of it reaches down the face', () => {
  for (const side of [1, -1] as const) {
    const m = buildHorn(bp, side, FULL, head);
    expect(m.index.length / 3).toBeLessThanOrEqual(6000);
    let buried = 0;
    for (let i = 0; i < m.position.length; i += 3) {
      const [u, v, w] = [m.position[i]!, m.position[i + 1]!, m.position[i + 2]!];
      // The old sculpt's horn root ran on down over the brow to the mouth; here what is below the brow is buried.
      if (u > 0.6 && v < 1.85) expect(head([u, v, w])).toBeLessThan(0);
      if (head([u, v, w]) < 0) buried++;
      expect(Math.abs(Math.hypot(m.normal[i]!, m.normal[i + 1]!, m.normal[i + 2]!) - 1)).toBeLessThan(1e-3);
    }
    expect(buried).toBeGreaterThan(FULL.sides); // at least the root ring is in the skull
    // The normals face out from the centre line.
    const mid = Math.floor(m.position.length / 6);
    const p: V3 = [m.position[mid * 3]!, m.position[mid * 3 + 1]!, m.position[mid * 3 + 2]!];
    const t = m.uv[mid * 2 + 1]!;
    const c = hornCentre(bp, side, t);
    expect((p[0] - c[0]) * m.normal[mid * 3]! + (p[1] - c[1]) * m.normal[mid * 3 + 1]! + (p[2] - c[2]) * m.normal[mid * 3 + 2]!).toBeGreaterThan(0);
  }
});

test('the bounds enclose the head, ears and all', () => {
  const h = headBounds(bp);
  expect(h.min[1]).toBeLessThan(-PROFILE.footSink);
  expect(h.max[1]).toBeGreaterThan(PROFILE.ear.tip[1] + 0.05);
  expect(h.max[0]).toBeGreaterThan(bp.heads.measures.muzzle + 0.05);
  expect(h.max[2]).toBeGreaterThan(PROFILE.ear.tip[2] + 0.05);
});
