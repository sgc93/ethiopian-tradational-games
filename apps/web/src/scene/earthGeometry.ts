import { HOLES } from '@etg/gebeta-rules';
import * as THREE from 'three';
import { bowlSurfaceY, hash2, HOLE_DEPTH, HOLE_RADIUS, holeCenter } from './layout';

/**
 * Smooth 2D value noise in [-1, 1] from a seeded integer lattice. With a `period`, the lattice
 * wraps, so a texture made from it tiles without seams.
 */
export function valueNoise(x: number, z: number, seed: number, period = 0): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fz = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const wrap = (n: number) => (period ? ((n % period) + period) % period : n);
  const at = (i: number, j: number) => hash2(wrap(i) * 7919 + seed, wrap(j) * 104729 - seed) * 2 - 1;
  const top = at(xi, zi) + (at(xi + 1, zi) - at(xi, zi)) * s(fx);
  const bottom = at(xi, zi + 1) + (at(xi + 1, zi + 1) - at(xi, zi + 1)) * s(fx);
  return top + (bottom - top) * s(fz);
}

/** How far below the board the surrounding ground lies; the patch slopes down to it at its edges. */
export const GROUND_Y = -0.3;
const EDGE_SLOPE = 0.8;

/** A patch of earth with the 12 holes scooped into it, each with a slight raised lip. */
export function buildEarthGeometry({
  width = 9,
  depth = 6,
  segments = 200,
  seed = 1,
}: { width?: number; depth?: number; segments?: number; seed?: number } = {}): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(width, depth, segments, Math.round((segments * depth) / width));
  geometry.rotateX(-Math.PI / 2);
  const centres = Array.from({ length: HOLES }, (_, h) => holeCenter(h));
  const pos = geometry.getAttribute('position');
  // Vertex shade: the bowls darken with depth, like scooped earth out of the sun.
  const shade = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let nearest = Infinity;
    for (const [cx, , cz] of centres) nearest = Math.min(nearest, Math.hypot(x - cx, z - cz));
    // Bumpy, trodden earth; smoother inside the bowls, where hands have worn it down.
    const bumps = 0.009 * valueNoise(x * 2.2, z * 2.2, seed) + 0.003 * valueNoise(x * 9, z * 9, seed + 1);
    const y = bowlSurfaceY(nearest) + bumps * (nearest < HOLE_RADIUS ? 0.3 : 1);
    // Slope down at the edges to meet the wider ground, which lies below the deepest bowl.
    const toEdge = Math.min(width / 2 - Math.abs(x), depth / 2 - Math.abs(z)) / EDGE_SLOPE;
    const keep = toEdge >= 1 ? 1 : Math.max(0, toEdge) ** 2 * (3 - 2 * Math.max(0, toEdge));
    pos.setY(i, y * keep + GROUND_Y * (1 - keep));
    shade.fill(1 - 0.45 * Math.min(1, Math.max(0, -y / HOLE_DEPTH)), i * 3, i * 3 + 3);
  }
  pos.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(shade, 3));
  geometry.computeVertexNormals();
  return geometry;
}
