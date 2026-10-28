import { HOLES, STONES_PER_HOLE, type HoleIndex, type Player, type RoundState } from './types';

/** First-round ownership: A owns holes 0–5, B owns 6–11. */
export function initialOwners(): Player[] {
  return Array.from({ length: HOLES }, (_, i) => (i < HOLES / 2 ? 0 : 1));
}

export function newRound(owners: readonly Player[], starter: Player): RoundState {
  return {
    board: Array(HOLES).fill(STONES_PER_HOLE),
    owners: [...owners],
    captured: [0, 0],
    toMove: starter,
    starter,
    over: false,
  };
}

/** Holes the player to move owns that hold at least one stone. */
export function legalMoves(state: RoundState): HoleIndex[] {
  const moves: HoleIndex[] = [];
  for (let h = 0; h < HOLES; h++) {
    if (state.owners[h] === state.toMove && (state.board[h] ?? 0) > 0) moves.push(h);
  }
  return moves;
}
