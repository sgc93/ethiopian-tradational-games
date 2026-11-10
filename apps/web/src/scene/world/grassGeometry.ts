import { mulberry32 } from '@etg/gebeta-rules';
import * as THREE from 'three';

/** Blade height range in game units (2–4.5 cm). */
export const GRASS_HEIGHT: [number, number] = [0.4, 0.9];
const BLADE_WIDTH = 0.045;
/** Blades grow in tufts: this many to a tuft, within this distance of its middle. */
const TUFT = { blades: 7, spread: 0.32 };
const MAT = { rx: 11, rz: 6.5 };
const REACH = 42;

/** Blade placements as [x, z, yaw, height], kept off the mat. */
export function grassPlacements(count: number, seed: number): [number, number, number, number][] {
  const rng = mulberry32(seed);
  const out: [number, number, number, number][] = [];
  const offMat = (x: number, z: number) => (x / MAT.rx) ** 2 + (z / MAT.rz) ** 2 > 1.16;
  while (out.length < count) {
    const a = rng() * Math.PI * 2;
    // Thickest by the mat, thinning out across the yard.
    const r = Math.pow(rng(), 0.72) * (REACH - TUFT.spread);
    const cx = r * Math.cos(a);
    const cz = r * Math.sin(a);
    if (!offMat(cx, cz)) continue;
    // A tuft is as tall as its tallest blade; the others are shorter and lean out from the middle.
    const tall = GRASS_HEIGHT[0] + rng() * (GRASS_HEIGHT[1] - GRASS_HEIGHT[0]);
    for (let b = 0; b < TUFT.blades && out.length < count; b++) {
      const ba = rng() * Math.PI * 2;
      const br = Math.sqrt(rng()) * TUFT.spread;
      const x = cx + br * Math.cos(ba);
      const z = cz + br * Math.sin(ba);
      if (!offMat(x, z)) continue;
      out.push([x, z, rng() * Math.PI, Math.max(GRASS_HEIGHT[0], tall * (0.55 + 0.45 * rng()))]);
    }
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
