import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { TOKENS } from './tokens';

test('tokens match the spec', () => {
  expect(TOKENS.ink950).toBe('#0a0806');
  expect(TOKENS.ink700).toBe('#261d15');
  expect(TOKENS.gold200).toBe('#f1dcaa');
  expect(TOKENS.gold400).toBe('#d6ae6a');
  expect(TOKENS.gold700).toBe('#7d5f33');
  expect(TOKENS.ember300).toBe('#ffc27a');
  expect(TOKENS.ember400).toBe('#ff9a3c');
  expect(TOKENS.ember600).toBe('#d9661f');
  expect(TOKENS.moon300).toBe('#b9cfee');
  expect(TOKENS.moon500).toBe('#7f9cc4');
  expect(TOKENS.text100).toBe('#f4ead8');
  expect(TOKENS.text500).toBe('#8f826b');
  expect(TOKENS.panel).toBe('rgba(13, 10, 7, 0.84)');
  expect(TOKENS.line).toBe('rgba(214, 174, 106, 0.55)');
  expect(TOKENS.lineSoft).toBe('rgba(214, 174, 106, 0.18)');
});

test('the stylesheet declares every token as a custom property with the same value', () => {
  const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8');
  for (const [name, value] of Object.entries(TOKENS)) {
    const prop = '--' + name.replace(/([a-z])(\d)/, '$1-$2').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    expect(css, prop).toContain(`${prop}: ${value};`);
  }
  for (const face of ['--f-display', '--f-text', '--f-geez', '--ui']) expect(css).toContain(face);
});
