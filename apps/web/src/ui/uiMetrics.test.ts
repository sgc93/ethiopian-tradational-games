import { expect, test } from 'vitest';
import { uiMetrics } from './uiMetrics';

test.each([
  [844, 390, 1, false, 56, 313],
  [750, 300, 0.82, true, 36.08, 254.08],
  [1920, 1080, 1.6, false, 89.6, 956.8],
  [844, 340, 0.8718, false, 48.82, 272.87],
])('uiMetrics %i×%i', (w, h, scale, compact, top, bottom) => {
  const m = uiMetrics(w, h);
  expect(m.scale).toBeCloseTo(scale, 3);
  expect(m.compact).toBe(compact);
  expect(m.bands.top).toBeCloseTo(top, 1);
  expect(m.bands.bottom).toBeCloseTo(bottom, 1);
  expect(m.width).toBe(w);
  expect(m.height).toBe(h);
});

test('the scale never drops below 0.82 or rises above 1.6', () => {
  expect(uiMetrics(500, 200).scale).toBe(0.82);
  expect(uiMetrics(4000, 2000).scale).toBe(1.6);
});
