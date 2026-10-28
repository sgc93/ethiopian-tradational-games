import { applyMove, legalMoves } from './round';
import type { HoleIndex, Player, RoundState } from './types';

export type Level = 'easy' | 'medium' | 'hard';
export type Strategy = (state: RoundState, rng: () => number) => HoleIndex;

export interface ChooseOptions {
  rng?: () => number;
  /** Wall-clock budget for the hard level, in ms. */
  deadlineMs?: number;
  /** Deepest search for the hard level, in whole turns. */
  maxDepth?: number;
  now?: () => number;
}

const HARD_DEADLINE_MS = 900;
const HARD_MAX_DEPTH = 10;
/** How much a stone still sitting in one of your holes is worth next to a captured one. */
const BOARD_WEIGHT = 0.25;

const pick = <T>(items: readonly T[], rng: () => number): T => items[Math.floor(rng() * items.length)]!;

export const randomMove: Strategy = (state, rng) => pick(legalMoves(state), rng);

/** Stones gained this turn by the mover minus those gained by the opponent. */
function turnGain(state: RoundState, hole: HoleIndex): number {
  const me = state.toMove;
  const after = applyMove(state, hole).state;
  return after.captured[me] - state.captured[me] - (after.captured[1 - me]! - state.captured[1 - me]!);
}

export const greedyMove: Strategy = (state, rng) => {
  let best = -Infinity;
  let bests: HoleIndex[] = [];
  for (const h of legalMoves(state)) {
    const g = turnGain(state, h);
    if (g > best) [best, bests] = [g, [h]];
    else if (g === best) bests.push(h);
  }
  return pick(bests, rng);
};

/** Score of `state` for `player`: stones won, plus a little for stones still in their holes. */
function evaluate(state: RoundState, player: Player): number {
  const other = 1 - player;
  const won = state.captured[player] - state.captured[other]!;
  if (state.over) return won * 1000;
  let onBoard = 0;
  for (let h = 0; h < state.board.length; h++) {
    const n = state.board[h]!;
    onBoard += state.owners[h] === player ? n : -n;
  }
  return won + BOARD_WEIGHT * onBoard;
}

class OutOfTime extends Error {}

/** Negamax with alpha-beta over whole turns; the score is for the player to move. */
function search(state: RoundState, depth: number, alpha: number, beta: number, deadline: () => boolean): number {
  if (state.over || depth === 0) return evaluate(state, state.toMove);
  if (deadline()) throw new OutOfTime();
  let best = -Infinity;
  for (const child of orderedChildren(state)) {
    const score = -search(child, depth - 1, -beta, -alpha, deadline);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Children sorted by the mover's immediate gain, which makes alpha-beta prune far more. */
function orderedChildren(state: RoundState): RoundState[] {
  const me = state.toMove;
  return legalMoves(state)
    .map((h) => applyMove(state, h).state)
    .sort((a, b) => b.captured[me] - b.captured[1 - me]! - (a.captured[me] - a.captured[1 - me]!));
}

function bestAtDepth(state: RoundState, depth: number, rng: () => number, deadline: () => boolean): HoleIndex {
  let best = -Infinity;
  let bests: HoleIndex[] = [];
  for (const h of legalMoves(state)) {
    const score = -search(applyMove(state, h).state, depth - 1, -Infinity, Infinity, deadline);
    if (score > best) [best, bests] = [score, [h]];
    else if (score === best) bests.push(h);
  }
  return pick(bests, rng);
}

export function chooseMove(state: RoundState, level: Level, opts: ChooseOptions = {}): HoleIndex {
  const rng = opts.rng ?? Math.random;
  if (level === 'easy') return rng() < 0.5 ? greedyMove(state, rng) : randomMove(state, rng);
  if (level === 'medium') return bestAtDepth(state, 2, rng, () => false);

  const now = opts.now ?? (() => performance.now());
  const stopAt = now() + (opts.deadlineMs ?? HARD_DEADLINE_MS);
  const maxDepth = opts.maxDepth ?? HARD_MAX_DEPTH;
  let move = bestAtDepth(state, 1, rng, () => false);
  for (let depth = 2; depth <= maxDepth; depth++) {
    try {
      move = bestAtDepth(state, depth, rng, () => now() > stopAt);
    } catch (e) {
      if (e instanceof OutOfTime) break;
      throw e;
    }
  }
  return move;
}
