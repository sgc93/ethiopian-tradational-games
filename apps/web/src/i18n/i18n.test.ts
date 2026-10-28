import { expect, test } from 'vitest';
import am from './am.json';
import en from './en.json';

function flatten(obj: object, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') Object.assign(out, flatten(v, `${prefix}${k}.`));
    else out[`${prefix}${k}`] = v;
  }
  return out;
}

test('en and am have exactly the same keys, none empty', () => {
  const e = flatten(en);
  const a = flatten(am);
  expect(Object.keys(a).sort()).toEqual(Object.keys(e).sort());
  for (const [k, v] of [...Object.entries(e), ...Object.entries(a)]) {
    expect(typeof v === 'string' && v.trim().length > 0, `empty string at ${k}`).toBe(true);
  }
});

test("Ge'ez game terms appear in the English strings", () => {
  const s = JSON.stringify(en);
  for (const w of ['ገበጣ', 'ቤት', 'አንበሳ', 'ሰው']) expect(s).toContain(w);
});
