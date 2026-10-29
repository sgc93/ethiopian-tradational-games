import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { charset, OUT, subsetAll } from './fonts.mjs';

test('the charset covers every string and the digits', () => {
  const c = charset();
  for (const ch of 'ገበጣ0123456789GEBETA–አንበሳሰው') assert.ok(c.includes(ch), ch);
});

test('subset files exist and are small', async () => {
  await subsetAll();
  const files = readdirSync(OUT).filter((f) => f.endsWith('.woff2'));
  assert.equal(files.length, 7);
  const total = files.reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
  assert.ok(total < 230_000, `fonts total ${total}`);
});
