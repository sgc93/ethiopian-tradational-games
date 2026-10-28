import {
  HOLES,
  IllegalMoveError,
  STONES_PER_HOLE,
  type HoleIndex,
  type Player,
  type RoundState,
  type TurnEvent,
} from './types';

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
  if (state.over) return moves;
  for (let h = 0; h < HOLES; h++) {
    if (state.owners[h] === state.toMove && (state.board[h] ?? 0) > 0) moves.push(h);
  }
  return moves;
}

/**
 * Play one turn (spec §4.2): sow from `hole`, relay from occupied holes, capture fours,
 * and stop at an empty hole, a last-stone capture, or a repeated relay position (§4.6).
 */
export function applyMove(state: RoundState, hole: HoleIndex): { state: RoundState; events: TurnEvent[] } {
  if (state.over || !legalMoves(state).includes(hole)) {
    throw new IllegalMoveError(`hole ${hole} cannot be played`);
  }
  const mover = state.toMove;
  const board = [...state.board];
  const captured: [number, number] = [state.captured[0], state.captured[1]];
  const events: TurnEvent[] = [{ type: 'turn-start', player: mover, hole }];
  const key = (pos: HoleIndex) => `${board.join(',')}|${pos}`;
  const seen = new Set([key(hole)]);

  let pos = hole;
  let hand = board[pos]!;
  board[pos] = 0;
  events.push({ type: 'pickup', hole: pos, count: hand, relay: false });

  for (;;) {
    pos = (pos + 1) % HOLES;
    const count = board[pos]! + 1;
    board[pos] = count;
    hand--;
    events.push({ type: 'drop', hole: pos, countAfter: count });

    if (hand > 0) {
      if (count === STONES_PER_HOLE) {
        const owner = state.owners[pos]!;
        captured[owner] += STONES_PER_HOLE;
        board[pos] = 0;
        events.push({ type: 'capture', hole: pos, by: owner, rule: 'owner' });
      }
      continue;
    }
    if (count === STONES_PER_HOLE) {
      captured[mover] += STONES_PER_HOLE;
      board[pos] = 0;
      events.push({ type: 'capture', hole: pos, by: mover, rule: 'last-stone' });
      events.push({ type: 'turn-end', reason: 'capture' });
      break;
    }
    if (count === 1) {
      events.push({ type: 'turn-end', reason: 'empty' });
      break;
    }
    const k = key(pos);
    if (seen.has(k)) {
      events.push({ type: 'turn-end', reason: 'loop' });
      break;
    }
    seen.add(k);
    hand = count;
    board[pos] = 0;
    events.push({ type: 'pickup', hole: pos, count, relay: true });
  }

  const toMove = (1 - mover) as Player;
  const next: RoundState = { ...state, board, captured, toMove };
  if (legalMoves(next).length > 0) return { state: next, events };

  // §4.3: the player to move owns no stones, so the round ends and the other player sweeps the board.
  const count = board.reduce((a, b) => a + b, 0);
  captured[mover] += count;
  board.fill(0);
  events.push({ type: 'round-end', sweptBy: mover, count, totals: [captured[0], captured[1]] });
  return { state: { ...next, over: true }, events };
}
