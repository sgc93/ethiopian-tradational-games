import * as THREE from 'three';
import type { Blueprint } from './blueprint';

/** Plain typed arrays, so a worker can build the geometry and transfer it. */
export interface GeometryData {
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array;
  index: Uint32Array;
}

export function toBufferGeometry(d: GeometryData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(d.normal, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
  g.setIndex(new THREE.BufferAttribute(d.index, 1));
  return g;
}

/** Packs a geometry (which must have position and uv) into transferable arrays, computing the normals. */
export function fromBufferGeometry(g: THREE.BufferGeometry): GeometryData {
  const indexed = g.index ? g : g.toNonIndexed();
  if (!indexed.index) {
    const n = indexed.getAttribute('position').count;
    indexed.setIndex(Array.from({ length: n }, (_, i) => i));
  }
  indexed.computeVertexNormals();
  return {
    position: new Float32Array(indexed.getAttribute('position').array),
    normal: new Float32Array(indexed.getAttribute('normal').array),
    uv: new Float32Array(indexed.getAttribute('uv').array),
    index: new Uint32Array(indexed.index!.array),
  };
}

/**
 * Moves a head-local geometry (u forward, v up, w sideways) to one end of the board. End B's head
 * stands at x = −heads.x and faces +x; end A's stands at +heads.x and faces −x. The heads
 * themselves are sculpted in `sculpt/` and shipped prebuilt (`headMesh.ts`).
 */
export function placeHead<T extends THREE.BufferGeometry>(g: T, end: 'A' | 'B', bp?: Blueprint): T {
  const x = bp?.heads.x ?? 5.25;
  if (end === 'A') g.rotateY(Math.PI).translate(x, 0, 0);
  else g.translate(-x, 0, 0);
  return g;
}
