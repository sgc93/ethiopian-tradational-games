import { expect, test } from 'vitest';
import { applyMove, IllegalMoveError, legalMoves, type Player, type RoundState } from '../src/index';
import { roundFrom } from './helpers';

test('round ends when the next player has no stones; the other sweeps the board', () => {
  const { state, events } = applyMove(roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), 0);
  expect(state.over).toBe(true);
  expect(state.board).toEqual(Array(12).fill(0));
  expect(state.captured).toEqual([24, 24]); // a drawn round
  expect(events.at(-1)).toEqual({ type: 'round-end', sweptBy: 0, count: 4, totals: [24, 24], reason: 'no-moves' });
});

test('a sweep can win the round', () => {
  const { state } = applyMove(roundFrom([1, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0], [20, 20], 0), 0);
  expect(state.captured).toEqual([28, 20]);
});

test('round goes on while the next player owns stones', () => {
  const { state } = applyMove(roundFrom([0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0], [20, 24], 0), 2);
  expect(state.over).toBe(false);
});

test('no moves are legal once the round is over', () => {
  const { state } = applyMove(roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), 0);
  expect(legalMoves(state)).toEqual([]);
  expect(() => applyMove(state, 1)).toThrow(IllegalMoveError);
});

const positionKey = (s: RoundState) => `${s.board.join(',')}|${s.toMove}`;

test('a position coming back a third time ends the round; the bigger holder takes what is left', () => {
  const before = roundFrom([0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0], [20, 24], 0);
  const after = applyMove(before, 2).state; // A holds 1 (hole 3), B holds 3 (hole 8)
  const { state, events } = applyMove({ ...before, seen: { [positionKey(after)]: 2 } }, 2);
  expect(state.over).toBe(true);
  expect(state.captured).toEqual([20, 28]);
  expect(events.at(-1)).toEqual({ type: 'round-end', sweptBy: 1, count: 4, totals: [20, 28], reason: 'repetition' });
});

test('on a tie in holdings, the player who just moved takes what is left', () => {
  const before = roundFrom([0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 0], [20, 24], 0);
  const after = applyMove(before, 2).state; // A holds 2 (holes 3, 5), B holds 2 (hole 8)
  const { state } = applyMove({ ...before, seen: { [positionKey(after)]: 2 } }, 2);
  expect(state.captured).toEqual([24, 24]);
});

test('a second visit does not end the round', () => {
  const before = roundFrom([0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0], [20, 24], 0);
  const after = applyMove(before, 2).state;
  expect(applyMove({ ...before, seen: { [positionKey(after)]: 1 } }, 2).state.over).toBe(false);
  expect(after.seen[positionKey(after)]).toBe(1);
});

test('stones circling forever now end the round (the case found in simulation)', () => {
  let s: RoundState = roundFrom([0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0], [16, 28], 1 as Player);
  let turns = 0;
  while (!s.over && turns < 500) {
    s = applyMove(s, legalMoves(s)[0]!).state;
    turns++;
  }
  expect(s.over).toBe(true);
});
