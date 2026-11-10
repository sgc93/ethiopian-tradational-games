import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { TOKENS } from './tokens';

test('the palette is leather, brass and bone, with the two players’ accents', () => {
  expect(TOKENS.ink950).toBe('#120907');
  expect(TOKENS.ink800).toBe('#27130d');
  expect(TOKENS.ox600).toBe('#5a2015');
  expect(TOKENS.gold200).toBe('#f0dcab');
  expect(TOKENS.gold400).toBe('#c9a15a');
  expect(TOKENS.gold700).toBe('#6f5527');
  expect(TOKENS.text100).toBe('#efe6d2');
  expect(TOKENS.paperInk).toBe('#3b2414');
  // The accents are the scene's own and did not change with the interface.
  expect(TOKENS.ember400).toBe('#ff9a3c');
  expect(TOKENS.moon300).toBe('#b9cfee');
});

test('the stylesheet declares every token as a custom property with the same value', () => {
  const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
  for (const [name, value] of Object.entries(TOKENS)) {
    const prop = '--' + name.replace(/([a-z])(\d)/, '$1-$2').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    expect(css, prop).toContain(`${prop}: ${value};`);
  }
  for (const face of ['--f-display', '--f-text', '--f-geez', '--ui']) expect(css).toContain(face);
});

test('the ornament comes from the board: its band and its stepped corners', () => {
  const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
  for (const motif of ['--band', '--corner', '--grain']) expect(css).toContain(`${motif}: url(`);
});
