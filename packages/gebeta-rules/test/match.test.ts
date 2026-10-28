import { expect, test } from 'vitest';
import {
  advanceMatch,
  applyMove,
  homesOf,
  initialOwners,
  isValidMatchState,
  newMatch,
  nextStarter,
  ownersForNextRound,
  playMove,
  roundResult,
  type MatchState,
  type Player,
  type RoundState,
} from '../src/index';

const done = (totals: [number, number], starter: Player = 0): RoundState => ({
  board: Array(12).fill(0),
  owners: initialOwners(),
  captured: totals,
  toMove: 1,
  starter,
  over: true,
});

test('A winning 28–20 takes hole 6', () =>
  expect(ownersForNextRound(roundResult(done([28, 20])))).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1]));
test('B winning 28–20 takes hole 0', () =>
  expect(ownersForNextRound(roundResult(done([20, 28])))).toEqual([1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]));
test('B winning 32–16 takes holes 0 and 1', () =>
  expect(ownersForNextRound(roundResult(done([16, 32])))).toEqual([1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]));
test('A winning 44–4 leaves B only hole 11', () =>
  expect(ownersForNextRound(roundResult(done([44, 4])))).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]));

test('a drawn round resets to six each, and the other player starts', () => {
  const r = roundResult(done([24, 24], 0));
  expect(r.winner).toBeNull();
  expect(ownersForNextRound(r)).toEqual(initialOwners());
  expect(nextStarter(r)).toBe(1);
});

test('the round winner starts the next round', () => expect(nextStarter(roundResult(done([20, 28], 0)))).toBe(1));

const atRoundEnd = (m: MatchState, totals: [number, number]): MatchState => ({
  ...m,
  round: done(totals, m.round.starter),
});

test('quick game: one round decides it', () => {
  expect(advanceMatch(atRoundEnd(newMatch('quick', 0), [28, 20])).result).toEqual({
    winner: 0,
    reason: 'quick',
    rounds: 1,
  });
  expect(advanceMatch(atRoundEnd(newMatch('quick', 0), [24, 24])).result).toEqual({
    winner: null,
    reason: 'quick',
    rounds: 1,
  });
});

test('match: round 1 result sets up round 2 with homes moved', () => {
  const m = advanceMatch(atRoundEnd(newMatch('match', 1), [20, 28]));
  expect(m.result).toBeNull();
  expect(m.roundNumber).toBe(2);
  expect(m.round.owners).toEqual([1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
  expect(m.round.board).toEqual(Array(12).fill(4));
  expect(m.round.toMove).toBe(1);
  expect(homesOf(m.round.owners, 1)).toBe(7);
  expect(m.history).toEqual([{ totals: [20, 28], winner: 1, starter: 1 }]);
});

test('match: a player with no homes loses at once', () => {
  const m = { ...newMatch('match', 0), roundNumber: 2 };
  expect(advanceMatch(atRoundEnd(m, [48, 0])).result).toEqual({ winner: 0, reason: 'no-homes', rounds: 2 });
});

test('match: round 5 decides it', () => {
  const m = { ...newMatch('match', 0), roundNumber: 5 };
  expect(advanceMatch(atRoundEnd(m, [20, 28])).result).toEqual({ winner: 1, reason: 'round-limit', rounds: 5 });
});

test('match: a drawn round 5 leads to an extra round', () => {
  const m = advanceMatch(atRoundEnd({ ...newMatch('match', 0), roundNumber: 5 }, [24, 24]));
  expect(m.result).toBeNull();
  expect(m.roundNumber).toBe(6);
  expect(m.round.toMove).toBe(1);
});

test('playMove plays on the current round and refuses a finished match', () => {
  const m = newMatch('quick', 0);
  const { match, events } = playMove(m, 0);
  expect(match.round).toEqual(applyMove(m.round, 0).state);
  expect(events).toEqual(applyMove(m.round, 0).events);
  const finished = advanceMatch(atRoundEnd(m, [28, 20]));
  expect(() => playMove(finished, 0)).toThrow();
});

test('isValidMatchState accepts real states and rejects broken ones', () => {
  expect(isValidMatchState(newMatch('match', 0))).toBe(true);
  expect(isValidMatchState(JSON.parse(JSON.stringify(newMatch('quick', 1))))).toBe(true);
  expect(
    isValidMatchState({ ...newMatch('match', 0), round: { ...newMatch('match', 0).round, board: Array(12).fill(3) } }),
  ).toBe(false);
  expect(isValidMatchState(null)).toBe(false);
  expect(isValidMatchState({ format: 'match' })).toBe(false);
});
