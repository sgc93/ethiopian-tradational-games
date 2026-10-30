import { expect, test } from 'vitest';
import { BLUEPRINT } from '../blueprint';
import { headBounds, headSdf, hornBounds, hornSdf, HORN_TIP_SPACING, PROFILE } from './sdf';

const bp = BLUEPRINT;
const head = (p: [number, number, number]) => headSdf(bp, p);

/** Walks from a point along an axis until the surface is crossed; the surface's coordinate there. */
function surface(f: (p: [number, number, number]) => number, from: [number, number, number], axis: 0 | 1 | 2, dir: 1 | -1, max = 4): number | null {
  const p: [number, number, number] = [...from];
  const step = 0.005;
  const inside = f(p) < 0;
  for (let s = 0; s < max; s += step) {
    p[axis] = from[axis] + dir * s;
    if (f(p) < 0 !== inside) return p[axis];
  }
  return null;
}

test('the head is solid at its core and empty around it', () => {
  expect(head([0, 0.8, 0])).toBeLessThan(0); // inside the neck
  expect(head([0.3, 1.7, 0])).toBeLessThan(0); // inside the skull
  expect(head([0, 0.8, 1.5])).toBeGreaterThan(0); // beside the neck
  expect(head([2.5, 1.5, 0])).toBeGreaterThan(0); // in front of the nose
  expect(head([0, 3.5, 0])).toBeGreaterThan(0); // above the ears
});

test('the landmarks sit where the side reference puts them', () => {
  const { muzzle, neckFootWidth, earTipV } = bp.heads.measures;
  // The nose reaches the blueprint's muzzle length, at the reference's height.
  const nose = surface(head, [0.8, PROFILE.noseTipV, 0], 0, 1);
  expect(nose).not.toBeNull();
  expect(Math.abs(nose! - muzzle)).toBeLessThan(0.12);
  expect(head([muzzle - 0.05, PROFILE.noseTipV + 0.35, 0])).toBeGreaterThan(0); // nothing above the nose tip
  // The neck's foot is as wide as the blueprint's, and deeper fore-and-aft.
  const footSide = surface(head, [0, 0.05, 0], 2, 1)!;
  expect(Math.abs(footSide * 2 - neckFootWidth)).toBeLessThan(0.12);
  const footFront = surface(head, [0, 0.05, 0], 0, 1)!;
  expect(footFront).toBeGreaterThan(0.7);
  // The ears' tips are the top of the head without its horns.
  const earTop = surface(head, [PROFILE.earBase.u - 0.14, PROFILE.earBase.v + 0.18, 0.39], 1, 1); // from inside the ear
  expect(earTop).not.toBeNull();
  expect(Math.abs(earTop! - earTipV)).toBeLessThan(0.15);
  // The skull's crown is where the reference draws it, between the horn roots.
  const crown = surface(head, [0.1, 1.5, 0], 1, 1)!;
  expect(Math.abs(crown - PROFILE.skullTopV)).toBeLessThan(0.1);
});

test('the head has two eyes, two nostrils and a mouth line cut into it', () => {
  const { eye, noseTipV, mouthV } = PROFILE;
  // An eyeball sits proud inside a socket: solid at the eye's centre, hollow just outside the ball.
  expect(head([eye.u, eye.v, 0.26])).toBeLessThan(0);
  const cheek = head([eye.u, eye.v, 0.4]);
  const brow = head([eye.u - 0.15, eye.v + 0.2, 0.3]);
  expect(brow).toBeLessThan(cheek); // the brow stands out further than the eye's rim
  // A nostril is a hollow in the nose's side, and the mouth a slit under it.
  const noseTip = bp.heads.measures.muzzle;
  const noseSide = surface(head, [noseTip - 0.13, noseTipV + 0.12, 0], 2, 1)!;
  const nostril = surface(head, [noseTip - 0.13, noseTipV, 0], 2, 1)!;
  expect(nostril).toBeLessThan(noseSide - 0.01);
  expect(head([noseTip - 0.4, mouthV, 0.2])).toBeGreaterThan(head([noseTip - 0.4, mouthV + 0.08, 0.2]));
});

test('a horn sweeps from the brow up and back to a point, ridged on its outer face, tips close together', () => {
  const s0 = bp.heads.horn.stations[0]!;
  expect(hornSdf(bp, 1, [s0.u, s0.v, 0.19])).toBeLessThan(0); // the root, in the skull
  const tip = bp.heads.horn.stations.at(-1)!;
  expect(hornSdf(bp, 1, [tip.u, tip.v, HORN_TIP_SPACING / 2])).toBeLessThan(0.03); // the tip, where the images put it
  expect(hornSdf(bp, 1, [tip.u, tip.v, 1.02])).toBeGreaterThan(0.2); // not at the blueprint's wide spread
  expect(hornSdf(bp, -1, [tip.u, tip.v, -HORN_TIP_SPACING / 2])).toBeLessThan(0.03); // the mirror
  // Ridges: along the outer face the surface rises and falls.
  const outerAt = (t: number) => {
    const st = bp.heads.horn.stations.find((s) => s.t >= t)!;
    return surface((p) => hornSdf(bp, 1, p), [st.u, st.v, 0.5], 1, 1);
  };
  const heights = [0.47, 0.5, 0.53, 0.56].map(outerAt);
  expect(heights.every((h) => h !== null)).toBe(true);
  expect(Math.max(...(heights as number[])) - Math.min(...(heights as number[]))).toBeGreaterThan(0.012);
});

test('the bounds enclose each part with a margin', () => {
  const h = headBounds(bp);
  expect(h.min[1]).toBeLessThan(0);
  expect(h.max[1]).toBeGreaterThan(bp.heads.measures.earTipV);
  expect(h.max[0]).toBeGreaterThan(bp.heads.measures.muzzle);
  const r = hornBounds(bp, 1);
  expect(r.max[2]).toBeGreaterThan(HORN_TIP_SPACING / 2);
  expect(r.min[2]).toBeLessThan(0.2);
});
