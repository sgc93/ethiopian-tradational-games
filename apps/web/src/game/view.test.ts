import { DEFAULT_RULES, initialOwners, newRound } from '@etg/gebeta-rules';
import { expect, test } from 'vitest';
import { firstLapEnd } from './view';

test('a hand runs out as many cups on as it has stones, round the board', () => {
  const round = newRound(initialOwners(), 0);
  // Four stones in every cup at the start: from cup 0 the last stone lands in cup 4.
  expect(firstLapEnd(round, 0)).toBe(4);
  // Past the last cup it comes round to the first.
  expect(firstLapEnd(round, 10)).toBe(2);
  // A big hand laps the whole board: thirteen stones from cup 3 end one cup on.
  expect(firstLapEnd({ ...round, board: round.board.map((n, i) => (i === 3 ? 13 : n)) }, 3)).toBe(4);
  // Sown clockwise it goes the other way.
  const clockwise = newRound(initialOwners(), 0, { ...DEFAULT_RULES, direction: 'clockwise' });
  expect(firstLapEnd(clockwise, 2)).toBe(10);
});
