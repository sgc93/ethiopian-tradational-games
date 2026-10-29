import { expect, test } from 'vitest';
import { stoneMatrices } from './Stones';

test('stones without a position are skipped and the rest are finite', () => {
  const m = stoneMatrices([[0.5, 0.1, -0.2]], 48);
  expect(m).toHaveLength(48);
  expect(m.filter(Boolean)).toHaveLength(1);
  const e = m[0]!.elements;
  expect(e.every(Number.isFinite)).toBe(true);
  expect([e[12], e[13], e[14]]).toEqual([0.5, 0.1, -0.2]);
});
