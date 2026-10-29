import { expect, test } from 'vitest';
import { BLUEPRINT } from './blueprint';
import { buildHead, placeHead, toBufferGeometry } from './headGeometry';

test('head fills the blueprint box', () => {
  const g = toBufferGeometry(buildHead(BLUEPRINT));
  g.computeBoundingBox();
  const b = g.boundingBox!;
  expect(b.max.y).toBeCloseTo(BLUEPRINT.heads.measures.earTipV, 1); // the ears are the top of the head
  expect(b.min.y).toBeCloseTo(0, 1); // the neck foot sits on the top face (v = 0)
  // The head without horns spans the head-only side outline (sideLength also counts the horns' sweep back).
  const us = BLUEPRINT.heads.outlines.sideHeadOnly.map((p) => p[0]);
  expect(b.max.x - b.min.x).toBeCloseTo(Math.max(...us) - Math.min(...us), 1);
  expect(b.max.x).toBeCloseTo(BLUEPRINT.heads.measures.muzzle, 1);
  expect(b.max.z).toBeLessThan(0.6); // half the ear width
  expect(b.max.z).toBeGreaterThan(0.4);
  expect(g.index!.count / 3).toBeLessThanOrEqual(8000);
  expect(g.index!.count / 3).toBeGreaterThan(2000);
});

test('a smaller budget gives fewer triangles', () => {
  expect(buildHead(BLUEPRINT, 4000).index.length).toBeLessThan(buildHead(BLUEPRINT, 8000).index.length);
  expect(buildHead(BLUEPRINT, 4000).index.length / 3).toBeLessThanOrEqual(4000);
});

test('every vertex is finite and the normals are unit length', () => {
  const d = buildHead(BLUEPRINT);
  expect(Array.from(d.position).every(Number.isFinite)).toBe(true);
  for (let i = 0; i < d.normal.length; i += 3) {
    expect(Math.hypot(d.normal[i]!, d.normal[i + 1]!, d.normal[i + 2]!)).toBeCloseTo(1, 1);
  }
});

test('placeHead puts the heads at the board ends, facing each other', () => {
  const b = toBufferGeometry(buildHead(BLUEPRINT));
  placeHead(b, 'B');
  b.computeBoundingBox();
  expect(b.boundingBox!.max.x).toBeCloseTo(-BLUEPRINT.heads.x + BLUEPRINT.heads.measures.muzzle, 1); // muzzle towards +x
  const a = toBufferGeometry(buildHead(BLUEPRINT));
  placeHead(a, 'A');
  a.computeBoundingBox();
  expect(a.boundingBox!.min.x).toBeCloseTo(BLUEPRINT.heads.x - BLUEPRINT.heads.measures.muzzle, 1); // muzzle towards −x
});
