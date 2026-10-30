// Turns a 1280 × 720 PNG capture of the home scene into apps/web/public/home-still.webp at 60 KB or
// less (spec §9, screen 12), lowering the WebP quality until it fits.
// Usage: node still.mjs <capture.png> [out.webp]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const LIMIT = 60 * 1024;
const [input, output = resolve(import.meta.dirname, '../../apps/web/public/home-still.webp')] = process.argv.slice(2);
if (!input) throw new Error('usage: node still.mjs <capture.png> [out.webp]');

const source = sharp(readFileSync(input)).resize(1280, 720, { fit: 'cover' });
let chosen = null;
for (const quality of [82, 76, 70, 64, 58, 52, 46, 40, 34]) {
  const buf = await source.clone().webp({ quality, effort: 6 }).toBuffer();
  chosen = { quality, buf };
  if (buf.length <= LIMIT) break;
}
writeFileSync(output, chosen.buf);
console.log(`${output}: ${(chosen.buf.length / 1024).toFixed(1)} KB at quality ${chosen.quality}${chosen.buf.length > LIMIT ? ' (over the 60 KB limit)' : ''}`);
