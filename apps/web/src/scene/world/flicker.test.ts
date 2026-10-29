import { expect, test } from 'vitest';
import { flicker, jitter } from './flicker';

test('flicker stays within 0.85–1.0 and averages near 0.93', () => {
  const v = Array.from({ length: 6000 }, (_, i) => flicker(i / 600));
  expect(Math.min(...v)).toBeGreaterThanOrEqual(0.85);
  expect(Math.max(...v)).toBeLessThanOrEqual(1.0);
  const mean = v.reduce((a, b) => a + b) / v.length;
  expect(mean).toBeGreaterThan(0.9);
  expect(mean).toBeLessThan(0.96);
});

test('flicker actually moves', () => {
  const v = Array.from({ length: 600 }, (_, i) => flicker(i / 600));
  expect(Math.max(...v) - Math.min(...v)).toBeGreaterThan(0.08);
});

test('jitter stays within ±0.3 on every axis', () => {
  for (let t = 0; t < 10; t += 0.013) for (const c of jitter(t, 1)) expect(Math.abs(c)).toBeLessThanOrEqual(0.3);
});
