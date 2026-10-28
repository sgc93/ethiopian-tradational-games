import { applyMove, initialOwners, legalMoves, newRound, type Player, type RoundState } from '@etg/gebeta-rules';
import { expect, test } from 'vitest';
import { LESSON_ORDER, lessonsInEvents, nextLesson, suggestMove } from './lessons';

const roundFrom = (board: number[], captured: [number, number], toMove: Player): RoundState => ({
  board,
  owners: initialOwners(),
  captured,
  toMove,
  starter: 0,
  over: false,
  seen: {},
});

test('the opening move teaches sowing, carrying on and stopping', () => {
  const { events } = applyMove(newRound(initialOwners(), 0), 0);
  expect(lessonsInEvents(events)).toEqual(new Set(['sow', 'relay', 'stop-empty']));
});

test("an owner capture during someone else's sowing is recognised", () => {
  const { events } = applyMove(roundFrom([0, 0, 0, 0, 3, 1, 3, 0, 0, 0, 1, 0], [20, 20], 0), 4);
  expect(lessonsInEvents(events).has('capture-owner')).toBe(true);
});

test('a last-stone capture is recognised', () => {
  const { events } = applyMove(roundFrom([0, 0, 0, 0, 0, 1, 3, 0, 0, 4, 0, 0], [20, 20], 0), 5);
  expect(lessonsInEvents(events).has('capture-last')).toBe(true);
});

test('the end of a round is recognised', () => {
  const { events } = applyMove(roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), 0);
  expect(lessonsInEvents(events).has('round-end')).toBe(true);
});

test('lessons come in order', () => {
  expect(nextLesson(new Set())).toBe('sow');
  expect(nextLesson(new Set(['sow', 'relay']))).toBe('stop-empty');
  expect(nextLesson(new Set(LESSON_ORDER))).toBeNull();
});

test('suggestMove finds a teaching move or says none', () => {
  const start = newRound(initialOwners(), 0);
  expect(legalMoves(start)).toContain(suggestMove(start, 'relay'));
  expect(suggestMove(roundFrom([0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0], [20, 24], 0), 'capture-last')).toBeNull();
  expect(suggestMove(roundFrom([0, 0, 0, 0, 0, 1, 3, 0, 0, 4, 0, 0], [20, 20], 0), 'capture-last')).toBe(5);
});
