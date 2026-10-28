import { applyMove, initialOwners, newRound } from './round';
import { HOLES, MAX_ROUNDS, STONES_PER_HOLE, type HoleIndex, type Player, type RoundState, type TurnEvent } from './types';

export type Format = 'quick' | 'match';

export interface RoundResult {
  readonly totals: readonly [number, number];
  /** null for a drawn (24–24) round. */
  readonly winner: Player | null;
  readonly starter: Player;
}

export interface MatchResult {
  /** null for a drawn quick game. */
  readonly winner: Player | null;
  readonly reason: 'quick' | 'no-homes' | 'round-limit';
  readonly rounds: number;
}

export interface MatchState {
  readonly format: Format;
  /** 1-based; above MAX_ROUNDS means an extra round after a drawn round 5. */
  readonly roundNumber: number;
  readonly round: RoundState;
  readonly history: readonly RoundResult[];
  readonly result: MatchResult | null;
}

export function newMatch(format: Format, firstPlayer: Player): MatchState {
  return { format, roundNumber: 1, round: newRound(initialOwners(), firstPlayer), history: [], result: null };
}

export function playMove(match: MatchState, hole: HoleIndex): { match: MatchState; events: TurnEvent[] } {
  if (match.result) throw new Error('the match is finished');
  const { state, events } = applyMove(match.round, hole);
  return { match: { ...match, round: state }, events };
}

export function roundResult(round: RoundState): RoundResult {
  if (!round.over) throw new Error('the round is not over');
  const [a, b] = round.captured;
  return { totals: [a, b], winner: a === b ? null : a > b ? 0 : 1, starter: round.starter };
}

/**
 * §4.5: the winner keeps their own row and takes holes from the start of the loser's row,
 * continuing in sowing order. A drawn round goes back to six holes each.
 */
export function ownersForNextRound(result: RoundResult): Player[] {
  const w = result.winner;
  if (w === null) return initialOwners();
  const homes = result.totals[w] / STONES_PER_HOLE;
  const start = w === 0 ? 0 : HOLES / 2;
  const owners: Player[] = Array(HOLES);
  for (let i = 0; i < HOLES; i++) owners[(start + i) % HOLES] = i < homes ? w : ((1 - w) as Player);
  return owners;
}

export function nextStarter(result: RoundResult): Player {
  return result.winner ?? ((1 - result.starter) as Player);
}

export function homesOf(owners: readonly Player[], player: Player): number {
  return owners.filter((o) => o === player).length;
}

/** §4.4: record the finished round, then end the match or set up the next round. */
export function advanceMatch(match: MatchState): MatchState {
  if (match.result) throw new Error('the match is finished');
  const r = roundResult(match.round);
  const history = [...match.history, r];
  const rounds = match.roundNumber;
  const finish = (result: MatchResult): MatchState => ({ ...match, history, result });

  if (match.format === 'quick') return finish({ winner: r.winner, reason: 'quick', rounds });
  const empty = r.totals.findIndex((t) => t === 0);
  if (empty !== -1) return finish({ winner: (1 - empty) as Player, reason: 'no-homes', rounds });
  if (rounds >= MAX_ROUNDS && r.winner !== null) return finish({ winner: r.winner, reason: 'round-limit', rounds });

  return {
    ...match,
    roundNumber: rounds + 1,
    round: newRound(ownersForNextRound(r), nextStarter(r)),
    history,
  };
}
