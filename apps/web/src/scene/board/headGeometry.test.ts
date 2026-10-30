import * as THREE from 'three';
import { expect, test } from 'vitest';
import { BLUEPRINT } from './blueprint';
import { fromBufferGeometry, placeHead, toBufferGeometry } from './headGeometry';

/** A stand-in head: a box reaching from the neck axis forward to the muzzle. */
function stubHead(): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(BLUEPRINT.heads.measures.muzzle, 1, 0.5);
  g.translate(BLUEPRINT.heads.measures.muzzle / 2, 0.5, 0);
  return g;
}

test('placeHead puts the heads at the board ends, facing each other', () => {
  const b = placeHead(stubHead(), 'B');
  b.computeBoundingBox();
  expect(b.boundingBox!.max.x).toBeCloseTo(-BLUEPRINT.heads.x + BLUEPRINT.heads.measures.muzzle, 3); // muzzle towards +x
  const a = placeHead(stubHead(), 'A');
  a.computeBoundingBox();
  expect(a.boundingBox!.min.x).toBeCloseTo(BLUEPRINT.heads.x - BLUEPRINT.heads.measures.muzzle, 3); // muzzle towards −x
});

test('geometry data round-trips through the transferable arrays with unit normals', () => {
  const d = fromBufferGeometry(stubHead());
  expect(Array.from(d.position).every(Number.isFinite)).toBe(true);
  for (let i = 0; i < d.normal.length; i += 3) expect(Math.hypot(d.normal[i]!, d.normal[i + 1]!, d.normal[i + 2]!)).toBeCloseTo(1, 3);
  const g = toBufferGeometry(d);
  expect(g.index!.count).toBe(d.index.length);
  expect(g.getAttribute('uv').count).toBe(d.position.length / 3);
});
