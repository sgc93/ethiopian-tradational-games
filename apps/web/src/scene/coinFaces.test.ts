import { expect, test } from 'vitest';
import { coinFaceSpec } from './coinFaces';

test('face spec: 24 sun rays and the word at 44% of the diameter', () => {
  expect(coinFaceSpec('ሰው')).toEqual({ rays: 24, fontPx: 225, word: 'ሰው' });
  expect(coinFaceSpec('አንበሳ', 256)).toEqual({ rays: 24, fontPx: 113, word: 'አንበሳ' });
});
