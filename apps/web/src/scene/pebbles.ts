import { mulberry32 } from '@etg/gebeta-rules';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { STONE_SIZE } from './layout';

/**
 * Eight tones sampled from the reference pebbles (`docs/design/board/images/19-pebbles.jpg`): two
 * greys of speckled granite, two dark browns, two sandy tans and two creams.
 */
export const PEBBLE_COLOURS: readonly string[] = ['#a2a5a3', '#8c949a', '#5d4737', '#4c3a2e', '#ab8558', '#bd9767', '#e2d2b4', '#dcd4c6'];

/** Irregular, slightly flattened pebble shapes, each about STONE_SIZE across. */
export function makePebbleGeometries(count: number, seed: number): THREE.BufferGeometry[] {
  return Array.from({ length: count }, (_, n) => {
    const rng = mulberry32(seed * 1000 + n);
    const phase = [rng(), rng(), rng()].map((p) => p * Math.PI * 2);
    const scale = new THREE.Vector3(0.9 + rng() * 0.25, 0.62 + rng() * 0.13, 0.8 + rng() * 0.2);

    const base = new THREE.IcosahedronGeometry(1, 2);
    base.deleteAttribute('normal');
    base.deleteAttribute('uv');
    const g = mergeVertices(base);
    const pos = g.getAttribute('position');
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Lumps from the direction alone, so the surface stays closed and smooth.
      const lump =
        0.12 * Math.sin(3.1 * v.x + phase[0]!) * Math.sin(2.7 * v.y + phase[1]!) + 0.07 * Math.sin(5.3 * v.z + phase[2]!);
      v.multiplyScalar(1 + lump).multiply(scale).multiplyScalar(STONE_SIZE / 2);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}
