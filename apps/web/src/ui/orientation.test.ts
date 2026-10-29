import { expect, test } from 'vitest';
import { isPortrait } from './orientation';

test('portrait when taller than wide', () => {
  expect(isPortrait(390, 844)).toBe(true);
  expect(isPortrait(844, 390)).toBe(false);
  expect(isPortrait(500, 500)).toBe(false);
});
