import { expect, test } from 'vitest';
import { BLUEPRINT } from './blueprint';
import { buildBoardBody, capProfile, stadiumShape } from './bodyGeometry';

test('bounding box matches the blueprint', () => {
  const g = buildBoardBody(BLUEPRINT);
  g.computeBoundingBox();
  const b = g.boundingBox!;
  expect(b.max.x).toBeCloseTo(6.05, 2);
  expect(b.min.x).toBeCloseTo(-6.05, 2);
  expect(b.max.z).toBeCloseTo(1.28, 2);
  expect(b.max.y).toBeCloseTo(0, 2);
  expect(b.min.y).toBeCloseTo(-1.8, 2); // the feet reach the ground
});

test('every cup bottom is at its blueprint depth', () => {
  const g = buildBoardBody(BLUEPRINT);
  const pos = g.getAttribute('position');
  for (const c of BLUEPRINT.cups.holes) {
    let minY = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Math.hypot(pos.getX(i) - c.x, pos.getZ(i) - c.z) < 0.05) minY = Math.min(minY, pos.getY(i));
    }
    expect(minY).toBeCloseTo(-0.36, 2);
  }
  // The bowls face inwards: the normal at a cup's bottom points up.
  const nrm = g.getAttribute('normal');
  const c0 = BLUEPRINT.cups.holes[0]!;
  for (let i = 0; i < pos.count; i++) {
    if (Math.hypot(pos.getX(i) - c0.x, pos.getZ(i) - c0.z) < 0.02 && pos.getY(i) < -0.35) expect(nrm.getY(i)).toBeGreaterThan(0.9);
  }
  for (const s of BLUEPRINT.stores.list) {
    let minY = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Math.hypot(pos.getX(i) - s.x, pos.getZ(i) - s.z) < 0.05) minY = Math.min(minY, pos.getY(i));
    }
    expect(minY).toBeCloseTo(-0.45, 2);
  }
});

test('three material groups and a sane triangle count', () => {
  const g = buildBoardBody(BLUEPRINT);
  expect(g.groups).toHaveLength(3);
  expect(g.index!.count / 3).toBeLessThan(40_000);
  expect(buildBoardBody(BLUEPRINT, 'half').index!.count).toBeLessThan(g.index!.count);
  for (const name of ['position', 'normal', 'uv']) expect(g.getAttribute(name)).toBeDefined();
});

test('the stadium outline and the cap profile', () => {
  const pts = stadiumShape(BLUEPRINT).getPoints(8);
  const xs = pts.map((p) => p.x);
  expect(Math.max(...xs)).toBeCloseTo(6.05, 2);
  const profile = capProfile(0.44, 0.36, 0.4489, 8);
  expect(profile[0]![0]).toBeCloseTo(0, 5); // starts on the axis at the bottom
  expect(profile[0]![1]).toBeCloseTo(-0.36, 5);
  expect(profile.at(-1)![1]).toBeCloseTo(0, 5); // ends at the rim on the top face
});
