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
  const board: number[] = Array(HOLES).fill(STONES_PER_HOLE);
  return {
    board,
    owners: [...owners],
    captured: [0, 0],
    toMove: starter,
    starter,
    over: false,
    seen: { [positionKey(board, starter)]: 1 },
  };
}

/**
 * PROVISIONAL rule, awaiting the owner: a position seen this many times means the stones are
 * only going round in circles, so the round ends.
 */
export const POSITION_REPEATS = 3;

function positionKey(board: readonly number[], toMove: Player): string {
  return `${board.join(',')}|${toMove}`;
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
  const posKey = positionKey(board, toMove);
  const visits = (state.seen[posKey] ?? 0) + 1;
  const next: RoundState = { ...state, board, captured, toMove, seen: { ...state.seen, [posKey]: visits } };

  let sweptBy: Player;
  let reason: 'no-moves' | 'repetition';
  if (legalMoves(next).length === 0) {
    // §4.3: the player to move owns no stones, so the other player sweeps the board.
    [sweptBy, reason] = [mover, 'no-moves'];
  } else if (visits >= POSITION_REPEATS) {
    // Provisional: whoever holds more of the remaining stones takes them; the mover on a tie.
    let held = 0;
    for (let h = 0; h < HOLES; h++) held += state.owners[h] === mover ? board[h]! : -board[h]!;
    [sweptBy, reason] = [held >= 0 ? mover : toMove, 'repetition'];
  } else {
    return { state: next, events };
  }

  const count = board.reduce((a, b) => a + b, 0);
  captured[sweptBy] += count;
  board.fill(0);
  events.push({ type: 'round-end', sweptBy, count, totals: [captured[0], captured[1]], reason });
  return { state: { ...next, over: true }, events };
}
