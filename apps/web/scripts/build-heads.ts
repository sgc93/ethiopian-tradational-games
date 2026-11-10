// Builds the prebuilt Walia ibex head set: the head inflated from the blueprint's traced outlines
// (sculpt/sdf.ts), meshed by marching cubes and trimmed to its budget, and both horns swept along
// the blueprint's stations (sculpt/horn.ts). Budgets: 16,000 triangles a head and 6,600 a horn,
// halved on the low tier. Packed into apps/web/public/models/ibex-head-<detail>.bin.
// Usage: node scripts/build-heads.ts [full|half]...
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import data from '../src/scene/board/board-dimensions.json' with { type: 'json' };
import type { Blueprint } from '../src/scene/board/blueprint.ts';
import { buildHorn } from '../src/scene/board/sculpt/horn.ts';
import { meshSdf } from '../src/scene/board/sculpt/mesh.ts';
import { encodeHeadSet } from '../src/scene/board/sculpt/pack.ts';
import { headBounds, headSdf } from '../src/scene/board/sculpt/sdf.ts';

const bp = data as unknown as Blueprint;
const details = process.argv.length > 2 ? process.argv.slice(2) : ['full', 'half'];
const outDir = resolve(import.meta.dirname, '../public/models');
mkdirSync(outDir, { recursive: true });

export const BUDGET = { full: { head: 16000, horn: 6600 }, half: { head: 8000, horn: 3400 } };

for (const detail of details) {
  const full = detail === 'full';
  const budget = full ? BUDGET.full : BUDGET.half;
  const started = Date.now();
  const field = (p: [number, number, number]) => headSdf(bp, p);
  const head = await meshSdf(field, headBounds(bp), { resolution: full ? 280 : 180, triangles: budget.head });
  // The head's uvs are not used for its grain (that is laid on by position), so they carry its
  // shade instead: how open each point is to the sky, over a short reach and over a long one.
  const open = (i: number, reach: number) => {
    const p: [number, number, number] = [head.position[i * 3]! + head.normal[i * 3]! * reach, head.position[i * 3 + 1]! + head.normal[i * 3 + 1]! * reach, head.position[i * 3 + 2]! + head.normal[i * 3 + 2]! * reach];
    return Math.min(1, Math.max(0, field(p) / reach));
  };
  for (let i = 0; i < head.position.length / 3; i++) {
    head.uv[i * 2] = Math.min(open(i, 0.03), open(i, 0.06));
    head.uv[i * 2 + 1] = open(i, 0.22);
  }
  const hornOptions = full ? { sides: 16, perRidge: 6, step: 0.01 } : { sides: 10, perRidge: 4, step: 0.02 };
  const set = { head, hornL: buildHorn(bp, 1, hornOptions, field), hornR: buildHorn(bp, -1, hornOptions, field) };
  const tris = (m: { index: Uint32Array }) => m.index.length / 3;
  for (const [name, m] of Object.entries(set)) {
    const limit = name === 'head' ? budget.head : budget.horn;
    if (tris(m) > limit) throw new Error(`${detail} ${name}: ${tris(m)} triangles, over the ${limit} budget`);
  }
  const bytes = encodeHeadSet(set);
  const file = resolve(outDir, `ibex-head-${detail}.bin`);
  writeFileSync(file, new Uint8Array(bytes));
  console.log(`${file}: head ${tris(head)} tris, horns ${tris(set.hornL)} + ${tris(set.hornR)}, ${(bytes.byteLength / 1024).toFixed(1)} KB, ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
