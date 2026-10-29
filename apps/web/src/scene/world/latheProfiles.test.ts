import { expect, test } from 'vitest';
import { BASKET, BRAZIER, CUP, JEBENA, lathe, STOOL_LEG } from './latheProfiles';

test('lathe profiles start on the axis and reach their heights', () => {
  for (const [name, profile, height] of [
    ['jebena', JEBENA, 5],
    ['cup', CUP, 1],
    ['brazier', BRAZIER, 3],
    ['basket', BASKET, 6],
    ['stool leg', STOOL_LEG, 6],
  ] as const) {
    expect(profile[0]![0], name).toBe(0);
    expect(Math.max(...profile.map((p) => p[1])), name).toBeCloseTo(height, 1);
    for (const [r] of profile) expect(r, name).toBeGreaterThanOrEqual(0);
  }
});

test('lathe builds a geometry of the profile height', () => {
  const g = lathe(JEBENA);
  g.computeBoundingBox();
  expect(g.boundingBox!.max.y).toBeCloseTo(5, 1);
  expect(g.boundingBox!.min.y).toBeCloseTo(0, 1);
  expect(g.getAttribute('position').count).toBeGreaterThan(50);
});
