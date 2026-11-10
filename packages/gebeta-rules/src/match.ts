import { applyMove, initialOwners, newRound, rulesOf } from './round';
import { HOLES, MAX_ROUNDS, STONES_PER_HOLE, type HoleIndex, type Player, type RoundState, type Rules, type TurnEvent, DEFAULT_RULES } from './types';

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

/** A new game under the given rules; every round of it carries them. */
export function newMatch(format: Format, firstPlayer: Player, rules: Rules = DEFAULT_RULES): MatchState {
  return { format, roundNumber: 1, round: newRound(initialOwners(), firstPlayer, rules), history: [], result: null };
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
 * continuing in sowing order (so the other way round the board when the sowing is clockwise).
 * A drawn round goes back to six holes each.
 */
export function ownersForNextRound(result: RoundResult, rules: Rules = DEFAULT_RULES): Player[] {
  const w = result.winner;
  if (w === null) return initialOwners();
  const homes = result.totals[w] / STONES_PER_HOLE;
  const clockwise = rules.direction === 'clockwise';
  // The winner's row in sowing order: holes 0–5 or 6–11 counter-clockwise, 5–0 or 11–6 clockwise.
  const start = clockwise ? (w === 0 ? HOLES / 2 - 1 : HOLES - 1) : w === 0 ? 0 : HOLES / 2;
  const step = clockwise ? HOLES - 1 : 1;
  const owners: Player[] = Array(HOLES);
  for (let i = 0; i < HOLES; i++) owners[(start + i * step) % HOLES] = i < homes ? w : ((1 - w) as Player);
  return owners;
}

/** Who starts the next round: the winner or the loser, as the rules say; after a drawn round, the other player than last time. */
export function nextStarter(result: RoundResult, rules: Rules = DEFAULT_RULES): Player {
  if (result.winner === null) return (1 - result.starter) as Player;
  return rules.nextStarter === 'loser' ? ((1 - result.winner) as Player) : result.winner;
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
    round: newRound(ownersForNextRound(r, rulesOf(match.round)), nextStarter(r, rulesOf(match.round)), rulesOf(match.round)),
    history,
  };
}
