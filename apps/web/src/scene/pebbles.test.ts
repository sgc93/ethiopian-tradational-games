import * as THREE from 'three';
import { expect, test } from 'vitest';
import { STONE_SIZE } from './layout';
import { makePebbleGeometries, PEBBLE_COLOURS } from './pebbles';

test('pebbles vary and stay pebble-sized', () => {
  const gs = makePebbleGeometries(6, 1);
  expect(gs).toHaveLength(6);
  for (const g of gs) {
    g.computeBoundingBox();
    const size = g.boundingBox!.getSize(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z);
    expect(largest).toBeGreaterThanOrEqual(0.8 * STONE_SIZE);
    expect(largest).toBeLessThanOrEqual(1.35 * STONE_SIZE);
    expect(size.y).toBeLessThan(largest); // flattened, like a real pebble
  }
  const arrays = gs.map((g) => Array.from(g.getAttribute('position').array).join(','));
  expect(new Set(arrays).size).toBe(6);
});

test('eight pebble tones from the reference pebbles', () => {
  expect(PEBBLE_COLOURS).toHaveLength(8);
  for (const c of PEBBLE_COLOURS) expect(c).toMatch(/^#[0-9a-f]{6}$/);
});
