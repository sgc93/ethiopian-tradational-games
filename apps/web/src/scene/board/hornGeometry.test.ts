import { expect, test } from 'vitest';
import { BLUEPRINT, type Blueprint } from './blueprint';
import { toBufferGeometry } from './headGeometry';
import { buildHorn } from './hornGeometry';

test('horns sweep to the blueprint spread and height', () => {
  const g = toBufferGeometry(buildHorn(BLUEPRINT, 1));
  g.computeBoundingBox();
  const b = g.boundingBox!;
  expect(b.max.z).toBeCloseTo(BLUEPRINT.heads.measures.hornSpread / 2, 1);
  expect(b.max.y).toBeCloseTo(BLUEPRINT.heads.height, 1);
  expect(g.index!.count / 3).toBeLessThanOrEqual(6000);
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i))).toBe(true);
  const other = toBufferGeometry(buildHorn(BLUEPRINT, -1));
  other.computeBoundingBox();
  expect(other.boundingBox!.min.z).toBeCloseTo(-b.max.z, 3);
});

test('ridges raise the outer face', () => {
  const noRidges: Blueprint = {
    ...BLUEPRINT,
    heads: { ...BLUEPRINT.heads, horn: { ...BLUEPRINT.heads.horn, ridges: { count: 0, list: [] } } },
  };
  const plain = buildHorn(noRidges, 1);
  const ridged = buildHorn(BLUEPRINT, 1);
  let bigger = 0;
  for (let i = 0; i < plain.position.length; i += 3) {
    const dp = Math.hypot(plain.position[i]!, plain.position[i + 1]!);
    const dr = Math.hypot(ridged.position[i]!, ridged.position[i + 1]!);
    if (dr > dp + 1e-4) bigger++;
  }
  expect(bigger).toBeGreaterThan(100);
  expect(Math.max(...ridged.position)).toBeGreaterThan(Math.max(...plain.position));
});

test('the half detail uses fewer triangles', () => {
  expect(buildHorn(BLUEPRINT, 1, 3000).index.length / 3).toBeLessThanOrEqual(3000);
});
