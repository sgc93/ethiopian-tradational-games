import { expect, test } from 'vitest';
import { makeNoiseData, noiseSample, valueNoise } from './noise';

test('value noise is in [-1, 1] and wraps with a period', () => {
  for (let i = 0; i < 200; i++) {
    const v = valueNoise(i * 0.37, i * 0.11, 3, 8);
    expect(v).toBeGreaterThanOrEqual(-1);
    expect(v).toBeLessThanOrEqual(1);
  }
  expect(valueNoise(0.3, 0.7, 3, 8)).toBeCloseTo(valueNoise(8.3, 0.7, 3, 8), 6);
});

test('noise texture data tiles', () => {
  const d = makeNoiseData(64, 1);
  expect(d.length).toBe(64 * 64 * 4);
  expect(d[3]).toBe(255);
  // The sample one past the right edge equals the left edge, and likewise top and bottom.
  for (let y = 0; y < 64; y += 7) expect(noiseSample(64, y, 64, 1)[0]).toBeCloseTo(noiseSample(0, y, 64, 1)[0], 9);
  for (let x = 0; x < 64; x += 7) expect(noiseSample(x, 64, 64, 1)[0]).toBeCloseTo(noiseSample(x, 0, 64, 1)[0], 9);
});
