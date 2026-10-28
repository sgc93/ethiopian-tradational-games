import { applyMove, initialOwners, newRound, type RoundState } from '@etg/gebeta-rules';
import { expect, test } from 'vitest';
import { buildTimeline, DURATION_MS, totalDuration } from './timeline';

test('opening-move timeline durations', () => {
  const { events } = applyMove(newRound(initialOwners(), 0), 0); // 5 pickups, 26 drops, no captures
  expect(totalDuration(buildTimeline(events, 'normal'))).toBe(5 * 300 + 26 * 220);
  expect(totalDuration(buildTimeline(events, 'fast'))).toBe(5 * 110 + 26 * 80);
  expect(totalDuration(buildTimeline(events, 'skip'))).toBe(0);
});

test('captures and the round-end sweep are timed', () => {
  const nearEnd: RoundState = {
    board: [1, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0],
    owners: initialOwners(),
    captured: [20, 20],
    toMove: 0,
    starter: 0,
    over: false,
    seen: {},
  };
  const { events } = applyMove(nearEnd, 0); // sweep of 8 stones
  expect(totalDuration(buildTimeline(events, 'normal'))).toBe(300 + 220 + 8 * 60);

  const capture: RoundState = { ...nearEnd, board: [0, 0, 0, 0, 0, 1, 3, 0, 0, 4, 0, 0], captured: [20, 20] };
  const { events: e2 } = applyMove(capture, 5);
  expect(totalDuration(buildTimeline(e2, 'normal'))).toBe(300 + 220 + DURATION_MS.normal.capture);
});

test('steps are back to back and in event order', () => {
  const { events } = applyMove(newRound(initialOwners(), 0), 0);
  const steps = buildTimeline(events, 'normal');
  expect(steps.map((s) => s.event)).toEqual(events);
  expect(steps[0]!.atMs).toBe(0);
  for (let i = 0; i + 1 < steps.length; i++) {
    expect(steps[i + 1]!.atMs).toBe(steps[i]!.atMs + steps[i]!.durationMs);
  }
});
