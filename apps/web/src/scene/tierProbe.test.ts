import { expect, test } from 'vitest';
import { probing } from './useTier';

test('the tier probe samples the home screen only once the world is ready, never the loading screen', () => {
  expect(probing({ done: false, mode: 'home', worldReady: true })).toBe(true);
  expect(probing({ done: false, mode: 'home', worldReady: false })).toBe(false);
  expect(probing({ done: false, mode: 'play', worldReady: true })).toBe(false);
  expect(probing({ done: true, mode: 'home', worldReady: true })).toBe(false);
});
