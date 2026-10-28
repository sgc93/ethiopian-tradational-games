import { expect, test } from 'vitest';
import { chooseMove, greedyMove, randomMove, simulate, type SimStats, type Strategy } from '../src/index';

const quantile = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.floor(q * (xs.length - 1))] ?? 0;
const summary = (s: SimStats) => ({
  rounds: { median: quantile(s.roundsPerMatch, 0.5), p90: quantile(s.roundsPerMatch, 0.9), max: Math.max(...s.roundsPerMatch) },
  turns: { median: quantile(s.turnsPerRound, 0.5), p90: quantile(s.turnsPerRound, 0.9), max: Math.max(...s.turnsPerRound) },
  events: { loops: s.loops, repetitionEnds: s.repetitionEnds, rounds: s.turnsPerRound.length },
});

test('random vs random full matches all finish', () => {
  const s = simulate({ matches: 2000, format: 'match', players: [randomMove, randomMove], seed: 1 });
  console.table(summary(s));
  expect(s.matches).toBe(2000);
  expect(s.unfinishedRounds).toBe(0);
  expect(s.unfinishedMatches).toBe(0);
  expect(Math.max(...s.roundsPerMatch)).toBeLessThanOrEqual(15);
}, 120_000);

test('greedy vs greedy full matches all finish', () => {
  const s = simulate({ matches: 300, format: 'match', players: [greedyMove, greedyMove], seed: 2 });
  console.table(summary(s));
  expect(s.unfinishedRounds).toBe(0);
  expect(s.unfinishedMatches).toBe(0);
}, 120_000);

test('medium vs greedy full matches all finish', () => {
  const medium: Strategy = (state, rng) => chooseMove(state, 'medium', { rng });
  const s = simulate({ matches: 150, format: 'match', players: [medium, greedyMove], seed: 3 });
  console.table(summary(s));
  expect(s.unfinishedRounds).toBe(0);
  expect(s.unfinishedMatches).toBe(0);
}, 120_000);
