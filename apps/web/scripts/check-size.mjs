// Sums the gzip size of everything the app ships (dist/, without source maps) and fails if it is
// over the 3 MB first-load budget from the design (§6): people on Ethiopian mobile data must not
// have to wait for a heavy download.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const BUDGET = 3_000_000;
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const sizes = files(dist)
  .filter((f) => !f.endsWith('.map'))
  .map((f) => ({ file: relative(dist, f), bytes: gzipSync(readFileSync(f), { level: 9 }).length }))
  .sort((a, b) => b.bytes - a.bytes);

const total = sizes.reduce((sum, s) => sum + s.bytes, 0);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

for (const s of sizes.slice(0, 10)) console.log(`${kb(s.bytes).padStart(10)}  ${s.file}`);
console.log(`\n${sizes.length} files, ${kb(total)} gzip in total (budget ${kb(BUDGET)})`);

if (total > BUDGET) {
  console.error(`Over budget by ${kb(total - BUDGET)}.`);
  process.exit(1);
}
