import { expect, test } from 'vitest';
import {
  advanceMatch,
  applyMove,
  chooseMove,
  DEFAULT_RULES,
  greedyMove,
  initialOwners,
  isValidMatchState,
  legalMoves,
  mulberry32,
  newMatch,
  newRound,
  nextStarter,
  normalizeRules,
  ownersForNextRound,
  randomMove,
  RULE_CHOICES,
  simulate,
  type Rules,
  type TurnEvent,
} from '../src/index';
import { roundFrom } from './helpers';

const under = (rules: Partial<Rules>): Rules => ({ ...DEFAULT_RULES, ...rules });
const drops = (events: TurnEvent[]) => events.filter((e) => e.type === 'drop').map((e) => e.hole);

test('the usual rules are what a round has unless told otherwise', () => {
  expect(newRound(initialOwners(), 0).rules).toEqual(DEFAULT_RULES);
  expect(DEFAULT_RULES).toEqual({ direction: 'counter-clockwise', stranded: 'sweep', passingFour: 'owner', nextStarter: 'winner' });
});

test('sowing goes the way the rules say', () => {
  const usual = applyMove(newRound(initialOwners(), 0), 2).events;
  expect(drops(usual).slice(0, 4)).toEqual([3, 4, 5, 6]);
  const clockwise = applyMove(newRound(initialOwners(), 0, under({ direction: 'clockwise' })), 2).events;
  expect(drops(clockwise).slice(0, 4)).toEqual([1, 0, 11, 10]);
});

test('out of stones, usual rule: the other player takes what is left and the round ends', () => {
  const { state, events } = applyMove(roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), 0);
  expect(state.over).toBe(true);
  expect(state.captured).toEqual([24, 24]);
  expect(events.some((e) => e.type === 'pass')).toBe(false);
});

test('out of stones, passing rule: they miss the turn and the other plays on', () => {
  const start = { ...roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), rules: under({ stranded: 'pass' }) };
  const { state, events } = applyMove(start, 0);
  expect(state.over).toBe(false);
  expect(state.toMove).toBe(0); // A again: B has nothing to play
  expect(events.at(-1)).toEqual({ type: 'pass', player: 1 });
  expect(state.captured).toEqual([20, 24]);
  expect(legalMoves(state)).toEqual([1, 2]);
});

test('out of stones, passing above four: the last four go to the player holding them', () => {
  const rules = under({ stranded: 'pass-above-four' });
  // Four left: no passing, the holder takes them.
  const four = applyMove({ ...roundFrom([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), rules }, 0);
  expect(four.state.over).toBe(true);
  expect(four.state.captured).toEqual([24, 24]);
  // Eight left: the player with none misses the turn and play goes on.
  const eight = applyMove({ ...roundFrom([1, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0], [20, 20], 0), rules }, 0);
  expect(eight.state.over).toBe(false);
  expect(eight.state.toMove).toBe(0);
  expect(eight.events.at(-1)).toEqual({ type: 'pass', player: 1 });
});

test('under a passing rule the round still ends when the board is empty', () => {
  // A's last stone makes four in A's own cup and is taken: nothing is left, so there is nothing to pass over.
  const start = { ...roundFrom([1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0), rules: under({ stranded: 'pass' }) };
  const { state, events } = applyMove(start, 0);
  expect(state.over).toBe(true);
  expect(state.captured).toEqual([24, 24]);
  expect(events.some((e) => e.type === 'pass')).toBe(false);
});

test('a four made in passing goes to the cup’s owner, or to the sower when the rules say so', () => {
  // A sows three from cup 5: the first makes four in B's cup 6 with stones still in hand.
  const board = [0, 0, 0, 0, 0, 3, 3, 0, 2, 0, 0, 0];
  expect(applyMove(roundFrom([...board], [20, 20], 0), 5).state.captured).toEqual([20, 24]);
  const sower = applyMove({ ...roundFrom([...board], [20, 20], 0), rules: under({ passingFour: 'sower' }) }, 5);
  expect(sower.state.captured).toEqual([24, 20]);
  expect(sower.events.find((e) => e.type === 'capture')).toEqual({ type: 'capture', hole: 6, by: 0, rule: 'owner' });
});

test('the next round is started by the winner or the loser, and by the other player after a draw', () => {
  const won = { totals: [28, 20] as const, winner: 0 as const, starter: 1 as const };
  expect(nextStarter(won)).toBe(0);
  expect(nextStarter(won, under({ nextStarter: 'loser' }))).toBe(1);
  const drawn = { totals: [24, 24] as const, winner: null, starter: 0 as const };
  expect(nextStarter(drawn)).toBe(1);
  expect(nextStarter(drawn, under({ nextStarter: 'loser' }))).toBe(1);
});

test('homes are won in sowing order, so the other way round when the sowing is clockwise', () => {
  const won = { totals: [28, 20] as const, winner: 0 as const, starter: 0 as const };
  expect(ownersForNextRound(won)).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1]);
  expect(ownersForNextRound(won, under({ direction: 'clockwise' }))).toEqual([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0]);
  const b = { totals: [16, 32] as const, winner: 1 as const, starter: 0 as const };
  expect(ownersForNextRound(b)).toEqual([1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]);
  expect(ownersForNextRound(b, under({ direction: 'clockwise' }))).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]);
});

test('a match carries its rules from round to round', () => {
  const rules = under({ direction: 'clockwise', nextStarter: 'loser' });
  let match = newMatch('match', 0, rules);
  expect(match.round.rules).toEqual(rules);
  const rng = mulberry32(5);
  while (!match.round.over) match = { ...match, round: applyMove(match.round, randomMove(match.round, rng)).state };
  const next = advanceMatch(match);
  if (!next.result) expect(next.round.rules).toEqual(rules);
});

test('rules from storage are taken one by one, and anything else is the usual rule', () => {
  expect(normalizeRules(undefined)).toEqual(DEFAULT_RULES);
  expect(normalizeRules('clockwise')).toEqual(DEFAULT_RULES);
  expect(normalizeRules({ direction: 'clockwise', stranded: 'sideways', passingFour: 7 })).toEqual(under({ direction: 'clockwise' }));
});

test('a saved game is valid with whole rules or none, and not with broken ones', () => {
  const match = newMatch('quick', 0, under({ stranded: 'pass' }));
  expect(isValidMatchState(JSON.parse(JSON.stringify(match)))).toBe(true);
  const { rules: _dropped, ...older } = match.round;
  expect(isValidMatchState(JSON.parse(JSON.stringify({ ...match, round: older })))).toBe(true);
  expect(isValidMatchState({ ...match, round: { ...match.round, rules: { direction: 'up' } } })).toBe(false);
});

test('the computer plays a legal move at every level when it gets the turn twice running', () => {
  const state = applyMove({ ...roundFrom([1, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0], [20, 20], 0), rules: under({ stranded: 'pass' }) }, 0).state;
  expect(state.toMove).toBe(0);
  for (const level of ['easy', 'medium', 'hard'] as const) {
    expect(legalMoves(state)).toContain(chooseMove(state, level, { rng: mulberry32(3), deadlineMs: 50 }));
  }
});

test('every combination of rules plays whole games to a finish with all 48 stones accounted for', () => {
  for (const direction of RULE_CHOICES.direction) {
    for (const stranded of RULE_CHOICES.stranded) {
      for (const passingFour of RULE_CHOICES.passingFour) {
        const rules: Rules = { direction, stranded, passingFour, nextStarter: 'winner' };
        const stats = simulate({ matches: 12, format: 'match', players: [greedyMove, randomMove], seed: 11, rules });
        expect(stats.unfinishedMatches, JSON.stringify(rules)).toBe(0);
        expect(stats.unfinishedRounds, JSON.stringify(rules)).toBe(0);
      }
    }
  }
});
