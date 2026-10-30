import * as THREE from 'three';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import type { PackedMesh } from './pack';
import type { V3 } from './sdf';

export interface MeshOptions {
  /** Grid cells along the longest side of the bounds. */
  resolution: number;
  /** Triangles to keep, or 0 to keep them all. */
  triangles: number;
}

/**
 * Meshes a signed-distance field inside `bounds` with marching cubes, trims the mesh to the
 * triangle budget, and gives it a cylindrical wrap of uvs about the vertical axis for the wood.
 */
export async function meshSdf(sdf: (p: V3) => number, bounds: { min: V3; max: V3 }, options: MeshOptions): Promise<PackedMesh> {
  const size = [0, 1, 2].map((k) => bounds.max[k]! - bounds.min[k]!) as V3;
  const longest = Math.max(...size);
  // Marching cubes wants a cube; pad the shorter sides so the cells stay cubic.
  const n = options.resolution;
  const cell = longest / (n - 3);
  const origin = size.map((s, k) => bounds.min[k]! - (longest - s) / 2 - cell) as V3;

  const mc = new MarchingCubes(n, new THREE.MeshBasicMaterial(), false, false, 1_000_000);
  mc.isolation = 80;
  mc.reset();
  const field = mc.field;
  const p: V3 = [0, 0, 0];
  for (let z = 0; z < n; z++) {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        p[0] = origin[0] + x * cell;
        p[1] = origin[1] + y * cell;
        p[2] = origin[2] + z * cell;
        // Inside is above the isolation level; the field is clamped so far-off cells stay sane.
        const d = sdf(p);
        field[z * n * n + y * n + x] = 80 - Math.max(-1, Math.min(1, d / (cell * 4))) * 60;
      }
    }
  }
  mc.update();
  // The triangles come out unindexed in the cube's [-1, 1] space, where cell i sits at i / (n/2) - 1.
  const raw = (mc as unknown as { positionArray: Float32Array; count: number });
  const vertices = raw.count;
  const position = new Float32Array(vertices * 3);
  for (let i = 0; i < vertices; i++) {
    for (let k = 0; k < 3; k++) {
      const c = (raw.positionArray[i * 3 + k]! + 1) * (n / 2);
      position[i * 3 + k] = origin[k]! + c * cell;
    }
  }
  const unwelded = new THREE.BufferGeometry();
  unwelded.setAttribute('position', new THREE.BufferAttribute(position, 3));
  let g = mergeVertices(unwelded);
  if (options.triangles > 0) {
    const verts = g.getAttribute('position').count;
    const target = Math.round(options.triangles / 2);
    if (verts > target) g = await new SimplifyModifier().modify(g, verts - target);
  }
  return withCylindricalUv(g);
}

/** Welds coincident vertices so the mesh is a connected surface the simplifier can work on. */
function mergeVertices(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = g.getAttribute('position');
  const key = new Map<string, number>();
  const remap: number[] = [];
  const out: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
    let id = key.get(k);
    if (id === undefined) {
      id = out.length / 3;
      key.set(k, id);
      out.push(x, y, z);
    }
    remap.push(id);
  }
  const index: number[] = [];
  const src = g.index;
  const count = src ? src.count : pos.count;
  for (let i = 0; i < count; i += 3) {
    const a = remap[src ? src.getX(i) : i]!;
    const b = remap[src ? src.getX(i + 1) : i + 1]!;
    const c = remap[src ? src.getX(i + 2) : i + 2]!;
    if (a !== b && b !== c && a !== c) index.push(a, b, c);
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  m.setIndex(index);
  return m;
}

/** Wood grain wraps round the part: u from the angle about the vertical axis, v from the height. */
function withCylindricalUv(g: THREE.BufferGeometry): PackedMesh {
  const pos = g.getAttribute('position');
  const position = new Float32Array(pos.array);
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    minY = Math.min(minY, pos.getY(i));
    maxY = Math.max(maxY, pos.getY(i));
  }
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (Math.atan2(pos.getZ(i), pos.getX(i)) / (2 * Math.PI) + 0.5) * 2 % 1;
    uv[i * 2 + 1] = (pos.getY(i) - minY) / Math.max(1e-6, maxY - minY);
  }
  return { position, uv, index: new Uint32Array(g.index!.array) };
}
