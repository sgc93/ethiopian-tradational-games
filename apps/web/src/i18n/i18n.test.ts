import { expect, test } from 'vitest';
import am from './am.json';
import en from './en.json';

const resources = { en, am } as const;

test('every hint marks a key phrase in both languages', () => {
  for (const lang of ['en', 'am'] as const) {
    const hints = resources[lang].guide.hint as Record<string, string>;
    expect(Object.keys(hints).length).toBeGreaterThan(0);
    for (const [k, v] of Object.entries(hints)) {
      expect(v, `${lang} ${k}`).toMatch(/<1>.+<\/1>/);
      expect(v.split('<1>').length, `${lang} ${k} has one mark`).toBe(2);
    }
  }
});

test('both languages carry the same hint keys', () => {
  expect(Object.keys(am.guide.hint).sort()).toEqual(Object.keys(en.guide.hint).sort());
});
