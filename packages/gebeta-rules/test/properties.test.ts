import fc from 'fast-check';
import { expect, test } from 'vitest';
import {
  advanceMatch,
  homesOf,
  isValidMatchState,
  mulberry32,
  newMatch,
  playMove,
  randomMove,
  TOTAL_STONES,
  type MatchState,
} from '../src/index';

function checkRound(m: MatchState) {
  const { board, captured, owners } = m.round;
  expect(board.reduce((a, b) => a + b, 0) + captured[0] + captured[1]).toBe(TOTAL_STONES);
  expect(captured[0] % 4).toBe(0);
  expect(captured[1] % 4).toBe(0);
  expect(owners).toHaveLength(12);
  expect(owners.every((o) => o === 0 || o === 1)).toBe(true);
}

test('stones, captures and ownership stay consistent through random play', () => {
  fc.assert(
    fc.property(
      fc.integer(),
      fc.integer({ min: 0, max: 400 }),
      fc.constantFrom('quick' as const, 'match' as const),
      (seed, moves, format) => {
        const rng = mulberry32(seed);
        let m = newMatch(format, (seed & 1) as 0 | 1);
        for (let i = 0; i < moves && !m.result; i++) {
          m = playMove(m, randomMove(m.round, rng)).match;
          checkRound(m);
          if (!m.round.over) continue;
          const before = m.roundNumber;
          m = advanceMatch(m);
          if (m.result) continue;
          expect(m.roundNumber).toBe(before + 1);
          expect(homesOf(m.round.owners, 0) + homesOf(m.round.owners, 1)).toBe(12);
          expect(m.round.board).toEqual(Array(12).fill(4));
          expect(isValidMatchState(m)).toBe(true);
        }
      },
    ),
    { numRuns: 300 },
  );
}, 60_000); // 300 random games; well over Vitest's 5 s default when both packages test at once
