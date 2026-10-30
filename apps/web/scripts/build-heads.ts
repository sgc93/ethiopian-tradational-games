// Builds the prebuilt Walia ibex head set from the signed-distance sculpt: the head and both horns,
// meshed by marching cubes and trimmed to the triangle budgets (spec §6: 8,000 per head and 6,000
// per horn, halved on the low tier), packed into apps/web/public/models/ibex-head-<detail>.bin.
// Usage: node scripts/build-heads.ts [full|half]...
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import data from '../src/scene/board/board-dimensions.json' with { type: 'json' };
import type { Blueprint } from '../src/scene/board/blueprint.ts';
import { meshSdf } from '../src/scene/board/sculpt/mesh.ts';
import { encodeHeadSet } from '../src/scene/board/sculpt/pack.ts';
import { headBounds, headSdf, hornBounds, hornSdf } from '../src/scene/board/sculpt/sdf.ts';

const bp = data as unknown as Blueprint;
const details = process.argv.length > 2 ? process.argv.slice(2) : ['full', 'half'];
const outDir = resolve(import.meta.dirname, '../public/models');
mkdirSync(outDir, { recursive: true });

for (const detail of details) {
  const full = detail === 'full';
  const started = Date.now();
  const head = await meshSdf((p) => headSdf(bp, p), headBounds(bp), { resolution: full ? 160 : 112, triangles: full ? 8000 : 4000 });
  const horn = (side: 1 | -1) => meshSdf((p) => hornSdf(bp, side, p), hornBounds(bp, side), { resolution: full ? 128 : 96, triangles: full ? 6000 : 3000 });
  const set = { head, hornL: await horn(1), hornR: await horn(-1) };
  const bytes = encodeHeadSet(set);
  const file = resolve(outDir, `ibex-head-${detail}.bin`);
  writeFileSync(file, new Uint8Array(bytes));
  const tris = (m: { index: Uint32Array }) => m.index.length / 3;
  console.log(`${file}: head ${tris(head)} tris, horns ${tris(set.hornL)} + ${tris(set.hornR)}, ${(bytes.byteLength / 1024).toFixed(1)} KB, ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
