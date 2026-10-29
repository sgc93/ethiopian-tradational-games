import { expect, test } from 'vitest';
import { flareCurve, hasVisited, loadingState, markVisited } from './loading';

test('loading state weights', () => {
  expect(loadingState(1, true, true)).toBe(1);
  expect(loadingState(0.5, false, false)).toBeCloseTo(0.35);
});

test('flare reaches 1 at its duration and is monotonic', () => {
  let last = 0;
  for (let t = 0; t <= 2.4; t += 0.1) {
    const v = flareCurve(t, 2.4);
    expect(v).toBeGreaterThanOrEqual(last);
    last = v;
  }
  expect(flareCurve(2.4, 2.4)).toBeCloseTo(1);
  expect(flareCurve(0.8, 0.8)).toBeCloseTo(1);
});

test('visited flag survives a throwing storage', () => {
  const bad = {
    getItem() {
      throw 1;
    },
    setItem() {
      throw 1;
    },
  };
  expect(hasVisited(bad)).toBe(false);
  expect(() => markVisited(bad)).not.toThrow();
});

test('visited flag round-trips through a working storage', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  expect(hasVisited(storage)).toBe(false);
  markVisited(storage);
  expect(hasVisited(storage)).toBe(true);
});
