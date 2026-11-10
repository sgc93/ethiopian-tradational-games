import { expect, test } from 'vitest';
import { countAt } from './useCountUp';

test('a count-up starts at nothing, ends on the total and never passes it', () => {
  expect(countAt(36, 0)).toBe(0);
  expect(countAt(36, 1)).toBe(36);
  expect(countAt(36, 2)).toBe(36);
  let last = 0;
  for (let k = 0; k <= 1; k += 0.05) {
    const v = countAt(36, k);
    expect(v).toBeGreaterThanOrEqual(last);
    expect(v).toBeLessThanOrEqual(36);
    last = v;
  }
});

test('most of the count is done in the first half', () => {
  expect(countAt(40, 0.5)).toBeGreaterThanOrEqual(30);
});
