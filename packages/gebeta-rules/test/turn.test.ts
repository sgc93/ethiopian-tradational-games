import { expect, test } from 'vitest';
import { applyMove, IllegalMoveError, initialOwners, newRound } from '../src/index';
import { roundFrom } from './helpers';

// Each board is [A's holes 0–5, B's holes 6–11]. Each `captured` makes the total 48.

test('last stone into an empty hole ends the turn', () => {
  const { state, events } = applyMove(roundFrom([0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0], [20, 24], 0), 2);
  expect(state.board).toEqual([0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 0]);
  expect(state.toMove).toBe(1);
  expect(events.map((e) => e.type)).toEqual(['turn-start', 'pickup', 'drop', 'turn-end']);
  expect(events.at(-1)).toEqual({ type: 'turn-end', reason: 'empty' });
});

test("last stone making 4 on the opponent's side is taken by the mover", () => {
  const { state, events } = applyMove(roundFrom([0, 0, 0, 0, 0, 1, 3, 0, 0, 4, 0, 0], [20, 20], 0), 5);
  expect(state.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0]);
  expect(state.captured).toEqual([24, 20]);
  expect(events).toContainEqual({ type: 'capture', hole: 6, by: 0, rule: 'last-stone' });
});

test("a hole reaching 4 mid-sowing goes to its owner, even on the mover's turn", () => {
  const { state, events } = applyMove(roundFrom([0, 0, 0, 0, 3, 1, 3, 0, 0, 0, 1, 0], [20, 20], 0), 4);
  expect(state.board).toEqual([0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0]);
  expect(state.captured).toEqual([20, 24]);
  expect(events).toContainEqual({ type: 'capture', hole: 6, by: 1, rule: 'owner' });
});

test('last stone into an occupied hole picks it up and carries on', () => {
  const { state, events } = applyMove(roundFrom([1, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0], [20, 24], 0), 0);
  expect(state.board).toEqual([0, 0, 1, 1, 0, 0, 0, 2, 0, 0, 0, 0]);
  expect(events).toContainEqual({ type: 'pickup', hole: 1, count: 2, relay: true });
});

test('a sowing that goes all the way round does not skip its starting hole', () => {
  const { state, events } = applyMove(roundFrom([12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [16, 20], 0), 0);
  expect(state.board).toEqual(Array(12).fill(1));
  expect(events.at(-2)).toEqual({ type: 'drop', hole: 0, countAfter: 1 });
});

test('opening move from hole 0', () => {
  const { state, events } = applyMove(newRound(initialOwners(), 0), 0);
  expect(state.board).toEqual([2, 7, 1, 6, 1, 6, 6, 6, 0, 1, 6, 6]);
  expect(state.captured).toEqual([0, 0]);
  expect(events.filter((e) => e.type === 'pickup')).toHaveLength(5);
  expect(events.filter((e) => e.type === 'drop')).toHaveLength(26);
});

test('an endless turn ends where the repeat is found (spec §4.6 example)', () => {
  const start = roundFrom([2, 1, 0, 2, 1, 0, 1, 2, 0, 2, 1, 0], [16, 20], 1);
  const { state, events } = applyMove(start, 7);
  expect(events.at(-1)).toEqual({ type: 'turn-end', reason: 'loop' });
  expect(events.filter((e) => e.type === 'pickup' && e.relay)).toHaveLength(59);
  expect(state.board).toEqual([2, 1, 0, 2, 1, 0, 1, 2, 0, 2, 1, 0]);
  expect(state.captured).toEqual([16, 20]);
  expect(state.toMove).toBe(0);
});

test('illegal moves throw', () => {
  const r = roundFrom([0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 0, 2], [20, 20], 0);
  expect(() => applyMove(r, 0)).toThrow(IllegalMoveError); // empty
  expect(() => applyMove(r, 8)).toThrow(IllegalMoveError); // opponent's hole
});

test('the input state is never changed', () => {
  const r = newRound(initialOwners(), 0);
  applyMove(r, 0);
  expect(r.board).toEqual(Array(12).fill(4));
  expect(r.captured).toEqual([0, 0]);
  expect(r.toMove).toBe(0);
});
