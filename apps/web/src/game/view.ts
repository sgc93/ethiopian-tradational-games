import { HOLES, legalMoves, type HoleIndex, type Player, type RoundState } from '@etg/gebeta-rules';
import type { TFunction } from 'i18next';
import type { Session } from './session';

/** Holes a human may tap right now: their turn, nothing moving, not paused. */
export function playableHoles(session: Session | null): Set<HoleIndex> {
  if (!session || session.phase !== 'awaiting-move' || session.paused) return new Set();
  const round = session.match.round;
  if (session.humanSeat !== null && round.toMove !== session.humanSeat) return new Set();
  return new Set(legalMoves(round));
}

/**
 * The cup a hand of stones lifted from `hole` runs out in: one stone to each cup onward, round
 * the board. That is the end of the first lap only; if the cup had stones the hand is picked up
 * again from there, and where that ends is not shown.
 */
export function firstLapEnd(round: RoundState, hole: HoleIndex): HoleIndex {
  return ((hole + (round.board[hole] ?? 0)) % HOLES) as HoleIndex;
}

/** "You" / "Computer" against the computer, "Player 1" / "Player 2" between friends. */
export function playerName(t: TFunction, session: Session, player: Player): string {
  if (session.humanSeat === null) return t(player === 0 ? 'players.p1' : 'players.p2');
  return t(player === session.humanSeat ? 'players.you' : 'players.computer');
}

/** Whose move is on screen: while a move animates, the player who made it. */
export function activePlayer(session: Session): Player {
  const first = session.turnEvents[0];
  if (session.phase === 'animating' && first?.type === 'turn-start') return first.player;
  return session.match.round.toMove;
}
