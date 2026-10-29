// Subsets the interface fonts to the characters the game uses and writes them to apps/web/public/fonts.
// `node fonts.mjs` builds the seven files; the charset comes from the i18n JSON plus digits and punctuation.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
export const OUT = resolve(here, '../../apps/web/public/fonts');
const I18N = resolve(here, '../../apps/web/src/i18n');

/** The faces to ship: fontsource package, its subset name, weight, style, and the output file. */
export const FACES = [
  { pkg: '@fontsource/cinzel', subset: 'latin', weight: 600, style: 'normal', out: 'cinzel-600.woff2' },
  { pkg: '@fontsource/cinzel', subset: 'latin', weight: 700, style: 'normal', out: 'cinzel-700.woff2' },
  { pkg: '@fontsource/eb-garamond', subset: 'latin', weight: 400, style: 'normal', out: 'eb-garamond-400.woff2' },
  { pkg: '@fontsource/eb-garamond', subset: 'latin', weight: 400, style: 'italic', out: 'eb-garamond-400i.woff2' },
  { pkg: '@fontsource/eb-garamond', subset: 'latin', weight: 500, style: 'normal', out: 'eb-garamond-500.woff2' },
  { pkg: '@fontsource/noto-serif-ethiopic', subset: 'ethiopic', weight: 600, style: 'normal', out: 'noto-serif-ethiopic-600.woff2' },
  { pkg: '@fontsource/noto-serif-ethiopic', subset: 'ethiopic', weight: 700, style: 'normal', out: 'noto-serif-ethiopic-700.woff2' },
];

const ALWAYS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz –—·…’“”‘፡።፣?!():,./%+-×';

/** Every character the game can show: the i18n strings in both languages, plus digits and punctuation. */
export function charset() {
  const chars = new Set(ALWAYS);
  for (const lang of ['en', 'am']) {
    const walk = (v) => {
      if (typeof v === 'string') for (const ch of v) chars.add(ch);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(JSON.parse(readFileSync(resolve(I18N, `${lang}.json`), 'utf8')));
  }
  return [...chars].filter((c) => c !== '\n').join('');
}

function sourceFile(face) {
  const name = face.pkg.split('/')[1];
  return resolve(dirname(require.resolve(`${face.pkg}/package.json`)), 'files', `${name}-${face.subset}-${face.weight}-${face.style}.woff2`);
}

/** Writes every face, subset to the charset, as woff2. */
export async function subsetAll() {
  mkdirSync(OUT, { recursive: true });
  const text = charset();
  for (const face of FACES) {
    const buffer = readFileSync(sourceFile(face));
    const out = await subsetFont(buffer, text, { targetFormat: 'woff2' });
    writeFileSync(resolve(OUT, face.out), out);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await subsetAll();
  console.log('fonts written to', OUT);
}
