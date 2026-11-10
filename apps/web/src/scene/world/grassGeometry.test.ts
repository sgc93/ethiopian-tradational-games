import { expect, test } from 'vitest';
import { buildGrass, GRASS_HEIGHT, grassPlacements } from './grassGeometry';

test('grass avoids the mat and stays within 42', () => {
  const p = grassPlacements(2000, 3);
  expect(p).toHaveLength(2000);
  for (const [x, z, , height] of p) {
    expect((x / 11) ** 2 + (z / 6.5) ** 2).toBeGreaterThan(1);
    expect(Math.hypot(x, z)).toBeLessThanOrEqual(42.01);
    expect(height).toBeGreaterThanOrEqual(GRASS_HEIGHT[0]);
    expect(height).toBeLessThanOrEqual(GRASS_HEIGHT[1]);
  }
});

test('the instanced geometry carries one offset per blade', () => {
  const g = buildGrass(500, 1);
  expect(g.getAttribute('aOffset').count).toBe(500);
  expect(g.instanceCount).toBe(500);
  expect(g.getAttribute('position').count).toBe(8); // a 3-segment strip: 4 rows of 2
});
