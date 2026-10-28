import { expect, test } from 'vitest';
import { planPlayback } from './playbackPlan';

const s = (id: number, turnId: number, animating: boolean) =>
  ({ id, turnId, phase: animating ? 'animating' : 'awaiting-move' }) as const;

test('a new session is drawn as it stands', () => {
  expect(planPlayback(null, s(1, 0, false), false)).toBe('sync');
  expect(planPlayback({ id: 1, turnId: 4 }, s(2, 0, false), true)).toBe('sync');
});

test('the next turn is animated', () => {
  expect(planPlayback({ id: 1, turnId: 0 }, s(1, 1, true), true)).toBe('animate');
});

test('nothing new means nothing to do', () => {
  expect(planPlayback({ id: 1, turnId: 1 }, s(1, 1, false), true)).toBe('none');
});

test('a move that cannot be animated is drawn and still reported done, so the game never hangs', () => {
  // The board missed the session starting (prev is from an older session).
  expect(planPlayback({ id: 1, turnId: 3 }, s(2, 1, true), true)).toBe('sync-then-done');
  // The board missed a turn in between, so its stones are out of date.
  expect(planPlayback({ id: 1, turnId: 1 }, s(1, 3, true), true)).toBe('sync-then-done');
  // No stones are being followed yet.
  expect(planPlayback({ id: 1, turnId: 0 }, s(1, 1, true), false)).toBe('sync-then-done');
});
