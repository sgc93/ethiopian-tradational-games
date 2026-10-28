import { expect, test } from 'vitest';
import { buildEarthGeometry } from './earthGeometry';
import { HOLE_DEPTH, holeCenter } from './layout';

function nearestY(g: ReturnType<typeof buildEarthGeometry>, x: number, z: number): number {
  const p = g.getAttribute('position');
  let best = Infinity;
  let y = 0;
  for (let i = 0; i < p.count; i++) {
    const d = Math.hypot(p.getX(i) - x, p.getZ(i) - z);
    if (d < best) [best, y] = [d, p.getY(i)];
  }
  return y;
}

test('earth bowls are deepest at hole centres', () => {
  const g = buildEarthGeometry({ seed: 1 });
  for (let h = 0; h < 12; h++) {
    const [x, , z] = holeCenter(h);
    expect(Math.abs(nearestY(g, x, z) + HOLE_DEPTH)).toBeLessThanOrEqual(0.03);
  }
  expect(Math.abs(nearestY(g, 3.4, 2.0))).toBeLessThan(0.03);
});
