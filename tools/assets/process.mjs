// Builds the game's textures from textures.json: `node process.mjs [id ...]` (all when none are given).
// Each source is made seamless, graded, resized and saved as WebP, with normal and roughness maps
// derived from its luminance. Outputs go to apps/web/public/textures/<id>-<kind>.webp.
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { grade, heightOf, heightToNormal, makeSeamless, roughnessFromHeight } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../../apps/web/public/textures');
const entries = JSON.parse(readFileSync(resolve(here, 'textures.json'), 'utf8'));
const wanted = process.argv.slice(2);

const dims = (size) => (Array.isArray(size) ? size : [size, size]);

async function build(entry) {
  const [w, h] = dims(entry.size);
  let image = sharp(resolve(here, entry.source), { density: 300 }).removeAlpha().resize(w, h, { fit: 'cover' });
  if (entry.seamless) image = await makeSeamless(image);
  if (entry.grade) {
    // Materialise the graded pixels: sharp orders operations itself, so a later greyscale would run first.
    const { data, info } = await grade(image, entry.grade).raw().toBuffer({ resolveWithObject: true });
    image = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
  }
  const outputs = entry.outputs ?? ['color'];
  const written = [];
  for (const kind of outputs) {
    const file = resolve(OUT, `${entry.id}-${kind}.webp`);
    if (kind === 'color') {
      await image.clone().webp({ quality: entry.quality ?? 82 }).toFile(file);
    } else {
      const height = await heightOf(image, kind === 'normal' ? (entry.normalSize ?? entry.size) : (entry.roughSize ?? entry.size));
      if (kind === 'normal') {
        const data = heightToNormal(height, entry.normalStrength ?? 2);
        await sharp(data, { raw: { width: height.width, height: height.height, channels: 3 } }).webp({ quality: 80 }).toFile(file);
      } else if (kind === 'rough') {
        const data = roughnessFromHeight(height, entry.rough ?? {});
        await sharp(data, { raw: { width: height.width, height: height.height, channels: 1 } }).webp({ quality: 85 }).toFile(file);
      } else {
        throw new Error(`${entry.id}: unknown output ${kind}`);
      }
    }
    written.push(`${entry.id}-${kind}.webp ${Math.round(statSync(file).size / 1024)} KB`);
  }
  console.log(written.join('   '));
}

mkdirSync(OUT, { recursive: true });
for (const entry of entries) {
  if (wanted.length && !wanted.includes(entry.id)) continue;
  await build(entry);
}
