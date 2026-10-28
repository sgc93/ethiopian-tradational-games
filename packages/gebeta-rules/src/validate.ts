import type { MatchState } from './match';
import { HOLES, STONES_PER_HOLE, TOTAL_STONES } from './types';

const isPlayer = (x: unknown): x is 0 | 1 => x === 0 || x === 1;
const isCount = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

/** Guards a match read back from storage: shape, 12 holes and owners, 48 stones, captures in fours. */
export function isValidMatchState(x: unknown): x is MatchState {
  if (!isObject(x)) return false;
  if (x.format !== 'quick' && x.format !== 'match') return false;
  if (!Number.isInteger(x.roundNumber) || (x.roundNumber as number) < 1) return false;
  if (!Array.isArray(x.history) || !(x.result === null || isObject(x.result))) return false;

  const r = x.round;
  if (!isObject(r)) return false;
  const { board, owners, captured } = r;
  if (!Array.isArray(board) || board.length !== HOLES || !board.every(isCount)) return false;
  if (!Array.isArray(owners) || owners.length !== HOLES || !owners.every(isPlayer)) return false;
  if (!Array.isArray(captured) || captured.length !== 2 || !captured.every(isCount)) return false;
  if (!isPlayer(r.toMove) || !isPlayer(r.starter) || typeof r.over !== 'boolean') return false;
  if (captured.some((c) => c % STONES_PER_HOLE !== 0)) return false;
  if (!isObject(r.seen) || !Object.values(r.seen).every(isCount)) return false;

  const total = [...board, ...captured].reduce((a: number, b: number) => a + b, 0);
  return total === TOTAL_STONES;
}
