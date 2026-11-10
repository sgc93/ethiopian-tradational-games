import { expect, test } from 'vitest';
import type { Vec3 } from './layout';
import { flight, type Motion } from './stoneMotion';

const FROM: Vec3 = [-2, 0.7, 1];
const TO: Vec3 = [3, 0.05, -1];
const KINDS: Motion[] = ['lift', 'carry', 'drop', 'capture', 'deal'];

test('every move starts where the stone is and ends exactly where it is going, at its resting angle', () => {
  for (const kind of KINDS) {
    expect(flight(kind, FROM, TO, 0, 2)).toEqual({ position: FROM, spin: 0 });
    expect(flight(kind, FROM, TO, 1, 2)).toEqual({ position: TO, spin: 0 });
    const nearlyThere = flight(kind, FROM, TO, 0.999, 2);
    nearlyThere.position.forEach((v, i) => expect(v).toBeCloseTo(TO[i]!, 1));
  }
});

test('positions are finite all the way and the stone never goes under where it lands', () => {
  for (const kind of KINDS) {
    for (let k = 0; k <= 1; k += 0.02) {
      const { position, spin } = flight(kind, FROM, TO, k, 1);
      expect(position.every(Number.isFinite)).toBe(true);
      expect(Number.isFinite(spin)).toBe(true);
      // A lift pops a little past where it is going (here, downwards); nothing else overshoots.
      if (kind !== 'lift') expect(position[1]).toBeGreaterThanOrEqual(TO[1] - 1e-9);
    }
  }
});

test('a dropped stone falls faster as it goes, then bounces once', () => {
  const y = (k: number) => flight('drop', [0, 0.7, 0], [1, 0, 0], k).position[1];
  // Falling: each step down is bigger than the last.
  expect(y(0.4) - y(0.6)).toBeGreaterThan(y(0.2) - y(0.4));
  // The bounce: back above the cup's floor between landing and rest.
  expect(y(0.8)).toBeCloseTo(0, 6);
  expect(y(0.9)).toBeGreaterThan(0.03);
});

test('captured and dealt stones go high; a carried stone only hops', () => {
  const peak = (kind: Motion) => Math.max(...Array.from({ length: 51 }, (_, i) => flight(kind, [0, 0, 0], [4, 0, 0], i / 50).position[1]));
  expect(peak('capture')).toBeGreaterThan(0.9);
  expect(peak('deal')).toBeGreaterThan(0.8);
  expect(peak('carry')).toBeLessThan(0.2);
});

test('a stone tumbles the turns asked for and a carried one does not turn', () => {
  expect(flight('drop', FROM, TO, 0.01, 1).spin).toBeGreaterThan(Math.PI * 1.9);
  expect(flight('capture', FROM, TO, 0.5, 2).spin).toBeCloseTo(Math.PI * 2, 6);
  expect(flight('carry', FROM, TO, 0.5, 3).spin).toBe(0);
});
