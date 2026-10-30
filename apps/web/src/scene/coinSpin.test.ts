import { expect, test } from 'vitest';
import { coinSpin } from './coinSpin';

const TAU = 2 * Math.PI;
const turns = (rx: number) => (((rx / TAU) % 1) + 1) % 1;

test('coin lands flat and face-up on the called side', () => {
  const l = coinSpin(1.2, 'lion');
  expect(l.y).toBeCloseTo(0.25);
  expect(turns(l.rx)).toBeCloseTo(0, 3);
  expect(l.ry).toBeCloseTo(0, 3);
  const p = coinSpin(1.2, 'person');
  expect(p.y).toBeCloseTo(0.25);
  expect(turns(p.rx)).toBeCloseTo(0.5, 3);
});

test('coin rises then falls', () => {
  expect(coinSpin(0.6, 'lion').y).toBeGreaterThan(1.5);
  expect(coinSpin(0, 'lion').y).toBeCloseTo(0.25);
  expect(coinSpin(0.3, 'lion').y).toBeGreaterThan(coinSpin(0, 'lion').y);
  expect(coinSpin(0.9, 'lion').y).toBeLessThan(coinSpin(0.6, 'lion').y);
});

test('after the duration the coin stays where it landed', () => {
  expect(coinSpin(5, 'person')).toEqual(coinSpin(1.2, 'person'));
  expect(coinSpin(-1, 'lion')).toEqual(coinSpin(0, 'lion'));
});

test('the spin eases out: most of the turning happens early', () => {
  const half = coinSpin(0.6, 'lion').rx / coinSpin(1.2, 'lion').rx;
  expect(half).toBeGreaterThan(0.8);
});
