import { mulberry32 } from '@etg/gebeta-rules';
import * as THREE from 'three';

/** Blade height range in game units (2–4.5 cm). */
export const GRASS_HEIGHT: [number, number] = [0.4, 0.9];
const BLADE_WIDTH = 0.06;
const MAT = { rx: 11, rz: 6.5 };
const HEARTH = { x: -26, z: -2, r: 9 };
const REACH = 20;

/** Blade placements as [x, z, yaw, height], kept off the mat and clear of the hearth. */
export function grassPlacements(count: number, seed: number): [number, number, number, number][] {
  const rng = mulberry32(seed);
  const out: [number, number, number, number][] = [];
  while (out.length < count) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * REACH;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    if ((x / MAT.rx) ** 2 + (z / MAT.rz) ** 2 <= 1.05) continue;
    if (Math.hypot(x - HEARTH.x, z - HEARTH.z) <= HEARTH.r) continue;
    out.push([x, z, rng() * Math.PI, GRASS_HEIGHT[0] + rng() * (GRASS_HEIGHT[1] - GRASS_HEIGHT[0])]);
  }
  return out;
}

/**
 * Short blades as one instanced strip (3 segments tall, so the wind can bend them), with a
 * per-blade `aOffset` of (x, z, yaw, height). The shader places and sways them.
 */
export function buildGrass(count: number, seed: number): THREE.InstancedBufferGeometry {
  const g = new THREE.InstancedBufferGeometry();
  const rows = 4;
  const position: number[] = [];
  const uv: number[] = [];
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const half = (BLADE_WIDTH / 2) * (1 - t * 0.85);
    position.push(-half, t, 0, half, t, 0);
    uv.push(0, t, 1, t);
  }
  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    const a = r * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  const offsets = new Float32Array(grassPlacements(count, seed).flat());
  g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 4));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), REACH + 1);
  return g;
}
