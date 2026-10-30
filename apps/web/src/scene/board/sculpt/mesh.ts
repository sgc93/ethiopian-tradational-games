import * as THREE from 'three';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';
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
 * triangle budget with a quadric simplifier (which spends the triangles where the surface
 * curves), takes each vertex's normal from the field's gradient so the trimmed mesh still shades
 * smooth, and gives it a cylindrical wrap of uvs about the vertical axis for the wood.
 */
export async function meshSdf(sdf: (p: V3) => number, bounds: { min: V3; max: V3 }, options: MeshOptions): Promise<PackedMesh> {
  const size = [0, 1, 2].map((k) => bounds.max[k]! - bounds.min[k]!) as V3;
  const longest = Math.max(...size);
  // Marching cubes wants a cube; pad the shorter sides so the cells stay cubic.
  const n = options.resolution;
  const cell = longest / (n - 3);
  const origin = size.map((s, k) => bounds.min[k]! - (longest - s) / 2 - cell) as V3;

  const mc = new MarchingCubes(n, new THREE.MeshBasicMaterial(), false, false, 1_500_000);
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
  const raw = mc as unknown as { positionArray: Float32Array; count: number };
  const position = new Float32Array(raw.count * 3);
  for (let i = 0; i < raw.count; i++) {
    for (let k = 0; k < 3; k++) {
      const c = (raw.positionArray[i * 3 + k]! + 1) * (n / 2);
      position[i * 3 + k] = origin[k]! + c * cell;
    }
  }
  let mesh = weld(position);
  if (options.triangles > 0 && mesh.index.length / 3 > options.triangles) mesh = await simplify(mesh, options.triangles);
  const normal = new Float32Array(mesh.position.length);
  // Sampled over a couple of cells, so the gradient reads the shape and not the grid under it.
  const e = cell * 1.5;
  for (let i = 0; i < mesh.position.length; i += 3) {
    const x = mesh.position[i]!;
    const y = mesh.position[i + 1]!;
    const z = mesh.position[i + 2]!;
    const gx = sdf([x + e, y, z]) - sdf([x - e, y, z]);
    const gy = sdf([x, y + e, z]) - sdf([x, y - e, z]);
    const gz = sdf([x, y, z + e]) - sdf([x, y, z - e]);
    const l = Math.hypot(gx, gy, gz) || 1;
    normal[i] = gx / l;
    normal[i + 1] = gy / l;
    normal[i + 2] = gz / l;
  }
  return { position: mesh.position, normal, uv: cylindricalUv(mesh.position), index: mesh.index };
}

interface Indexed {
  position: Float32Array;
  index: Uint32Array;
}

/** Welds coincident vertices so the mesh is a connected surface the simplifier can work on. */
function weld(position: Float32Array): Indexed {
  const key = new Map<string, number>();
  const out: number[] = [];
  const remap: number[] = [];
  for (let i = 0; i < position.length; i += 3) {
    const x = position[i]!;
    const y = position[i + 1]!;
    const z = position[i + 2]!;
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
  for (let i = 0; i < remap.length; i += 3) {
    const [a, b, c] = [remap[i]!, remap[i + 1]!, remap[i + 2]!];
    if (a !== b && b !== c && a !== c) index.push(a, b, c);
  }
  return { position: new Float32Array(out), index: new Uint32Array(index) };
}

/** Trims to the triangle budget, keeping the shape, and drops the vertices no longer used. */
async function simplify(mesh: Indexed, triangles: number): Promise<Indexed> {
  await MeshoptSimplifier.ready;
  const [kept] = MeshoptSimplifier.simplify(mesh.index, mesh.position, 3, triangles * 3, 1, []);
  const remap = new Map<number, number>();
  const position: number[] = [];
  const index = new Uint32Array(kept.length);
  for (let i = 0; i < kept.length; i++) {
    const v = kept[i]!;
    let id = remap.get(v);
    if (id === undefined) {
      id = position.length / 3;
      remap.set(v, id);
      position.push(mesh.position[v * 3]!, mesh.position[v * 3 + 1]!, mesh.position[v * 3 + 2]!);
    }
    index[i] = id;
  }
  return { position: new Float32Array(position), index };
}

/** Wood grain wraps round the part: u from the angle about the vertical axis, v from the height. */
function cylindricalUv(position: Float32Array): Float32Array {
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < position.length; i += 3) {
    minY = Math.min(minY, position[i]!);
    maxY = Math.max(maxY, position[i]!);
  }
  const uv = new Float32Array((position.length / 3) * 2);
  for (let i = 0, j = 0; i < position.length; i += 3, j += 2) {
    uv[j] = ((Math.atan2(position[i + 2]!, position[i]!) / (2 * Math.PI) + 0.5) * 2) % 1;
    uv[j + 1] = (position[i + 1]! - minY) / Math.max(1e-6, maxY - minY);
  }
  return uv;
}
