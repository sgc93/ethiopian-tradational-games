import { expect, test } from 'vitest';
import { initialOwners, legalMoves, newRound, type Player } from '../src/index';
import { roundFrom } from './helpers';

test('a new round has 4 stones in every hole and A owns 0–5', () => {
  const r = newRound(initialOwners(), 1);
  expect(r.board).toEqual(Array(12).fill(4));
  expect(r.owners).toEqual([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
  expect(r.captured).toEqual([0, 0]);
  expect(r.toMove).toBe(1);
  expect(r.starter).toBe(1);
  expect(r.over).toBe(false);
});

test("legal moves are the mover's own non-empty holes", () => {
  const r = roundFrom([0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 0, 2], [20, 20], 0);
  expect(legalMoves(r)).toEqual([1, 5]);
  expect(legalMoves({ ...r, toMove: 1 })).toEqual([8, 11]);
});

test('legal moves follow ownership, not the physical row', () => {
  const owners: Player[] = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1]; // A owns hole 6 too
  const r = roundFrom([0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4], [20, 20], 0, owners);
  expect(legalMoves(r)).toEqual([6]);
});
