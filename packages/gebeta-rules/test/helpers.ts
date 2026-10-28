import { initialOwners, TOTAL_STONES, type Player, type RoundState } from '../src/index';

/** Build a round position for a test. Throws unless all 48 stones are accounted for. */
export function roundFrom(
  board: number[],
  captured: [number, number],
  toMove: Player,
  owners: Player[] = initialOwners(),
): RoundState {
  const total = board.reduce((a, b) => a + b, 0) + captured[0] + captured[1];
  if (board.length !== 12 || owners.length !== 12 || total !== TOTAL_STONES) {
    throw new Error(`bad fixture: ${board.length} holes, ${total} stones`);
  }
  return { board, owners, captured, toMove, starter: 0, over: false };
}
