import { expect, test } from 'vitest';
import { decide, median, nextTier, readStoredTier, storeTier, TIERS, type Tier } from './tiers';

test.each([
  ['mid', 20, 'low'],
  ['mid', 40, 'mid'],
  ['mid', 60, 'high'],
  ['high', 60, 'high'],
  ['minimal', 10, 'minimal'],
  ['low', 27.9, 'minimal'],
  ['low', 55.1, 'mid'],
])('nextTier(%s, %s) = %s', (current, fps, expected) => {
  expect(nextTier(current as Tier, fps)).toBe(expected);
});

test('median ignores order and handles even counts', () => {
  expect(median([50, 10, 30])).toBe(30);
  expect(median([10, 20, 30, 40])).toBe(25);
  expect(median([])).toBe(0);
});

test('storage that throws is ignored', () => {
  const bad = {
    getItem() {
      throw new Error('private');
    },
    setItem() {
      throw new Error('private');
    },
  };
  expect(readStoredTier(bad)).toBeNull();
  expect(() => storeTier(bad, 'low')).not.toThrow();
  expect(readStoredTier(null)).toBeNull();
  const store = new Map<string, string>();
  const ok = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  storeTier(ok, 'low');
  expect(readStoredTier(ok)).toBe('low');
  ok.setItem('gebeta.tier', 'nonsense');
  expect(readStoredTier(ok)).toBeNull();
});

test('the table has the spec counts', () => {
  expect(TIERS.high.grass).toBe(3000);
  expect(TIERS.mid.grass).toBe(1500);
  expect(TIERS.low.embers).toBe(40);
  expect(TIERS.minimal.embers).toBe(24);
  expect(TIERS.minimal.post).toBe('none');
  expect(TIERS.minimal.bakedShadow).toBe(true);
  expect(TIERS.low.shadowMap).toBe(512);
  expect(TIERS.high.detail).toBe('full');
  expect(TIERS.low.detail).toBe('half');
  expect(TIERS.minimal.dpr).toBe(0.85);
});

test('a hidden tab or too few samples never changes the tier', () => {
  expect(decide('mid', [0, 0, 0], 'hidden')).toBe('mid');
  expect(decide('mid', Array(60).fill(1000 / 20), 'hidden')).toBe('mid');
  expect(decide('mid', Array(20).fill(1000 / 20), 'visible')).toBe('mid'); // fewer than 60 samples
  expect(decide('mid', Array(60).fill(1000 / 20), 'visible')).toBe('low');
  expect(decide('mid', Array(60).fill(1000 / 60), 'visible')).toBe('high');
});
