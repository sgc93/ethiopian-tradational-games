import { expect, test } from 'vitest';
import {
  applyMove,
  chooseMove,
  greedyMove,
  initialOwners,
  legalMoves,
  mulberry32,
  newRound,
  randomMove,
  roundResult,
  type ChooseOptions,
  type Level,
  type RoundResult,
  type Strategy,
} from '../src/index';

function playQuick(a: Strategy, b: Strategy, seed: number, aStarts: boolean): RoundResult {
  const rng = mulberry32(seed);
  let state = newRound(initialOwners(), aStarts ? 0 : 1);
  while (!state.over) state = applyMove(state, (state.toMove === 0 ? a : b)(state, rng)).state;
  return roundResult(state);
}

/** Share of decisive games won by `a`, alternating who starts, seeds 1..games. */
function winRate(a: Strategy, b: Strategy, games: number): number {
  let wins = 0;
  let decisive = 0;
  for (let i = 1; i <= games; i++) {
    const r = playQuick(a, b, i, i % 2 === 0);
    if (r.winner !== null) decisive++;
    if (r.winner === 0) wins++;
  }
  return wins / decisive;
}

const asStrategy =
  (level: Level, opts: ChooseOptions = {}): Strategy =>
  (s, rng) =>
    chooseMove(s, level, { ...opts, rng });

test('mulberry32 is deterministic and stays in [0, 1)', () => {
  expect(mulberry32(7)()).toBe(mulberry32(7)());
  const r = mulberry32(9);
  for (let i = 0; i < 1000; i++) {
    const x = r();
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  }
});

test('every level returns a legal move', () => {
  const s = newRound(initialOwners(), 0);
  for (const l of ['easy', 'medium', 'hard'] as const) {
    expect(legalMoves(s)).toContain(chooseMove(s, l, { rng: mulberry32(1), deadlineMs: 100 }));
  }
});

test('greedy takes an immediate capture', () => {
  // Hole 5's single stone lands on hole 6 (3 stones) and takes 4; hole 1 just moves.
  const s = { ...newRound(initialOwners(), 0), board: [0, 1, 0, 0, 0, 1, 3, 0, 0, 4, 3, 0], captured: [16, 20] as const };
  expect(greedyMove(s, mulberry32(1))).toBe(5);
});

test('medium beats random', () => {
  const rate = winRate(asStrategy('medium'), randomMove, 200);
  console.log('medium vs random', rate.toFixed(3));
  expect(rate).toBeGreaterThanOrEqual(0.85);
});

test('hard beats greedy', () => {
  const rate = winRate(asStrategy('hard', { deadlineMs: 150, maxDepth: 4 }), greedyMove, 200);
  console.log('hard (depth ≤ 4) vs greedy', rate.toFixed(3));
  expect(rate).toBeGreaterThanOrEqual(0.65);
}, 120_000);

test('easy is beatable', () => {
  const rate = winRate(asStrategy('easy'), greedyMove, 200);
  console.log('easy vs greedy', rate.toFixed(3));
  expect(rate).toBeLessThanOrEqual(0.5);
});

test('hard respects its deadline', () => {
  const rng = mulberry32(3);
  let s = newRound(initialOwners(), 0);
  for (let i = 0; i < 10; i++) s = applyMove(s, randomMove(s, rng)).state;
  expect(s.over).toBe(false);
  const t0 = performance.now();
  chooseMove(s, 'hard', { rng: mulberry32(1) });
  expect(performance.now() - t0).toBeLessThan(1000);
});
