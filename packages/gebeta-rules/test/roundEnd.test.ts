import { expect, test } from 'vitest';
import { applyMove, IllegalMoveError, legalMoves } from '../src/index';
import { roundFrom } from './helpers';

test('round ends when the next player has no stones; the other sweeps the board', () => {
  const { state, events } = applyMove(roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), 0);
  expect(state.over).toBe(true);
  expect(state.board).toEqual(Array(12).fill(0));
  expect(state.captured).toEqual([24, 24]); // a drawn round
  expect(events.at(-1)).toEqual({ type: 'round-end', sweptBy: 0, count: 4, totals: [24, 24] });
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
