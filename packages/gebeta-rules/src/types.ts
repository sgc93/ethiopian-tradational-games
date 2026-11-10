export const HOLES = 12;
export const STONES_PER_HOLE = 4;
export const TOTAL_STONES = 48;
export const MAX_ROUNDS = 5;

/** 0 = A (sits along holes 0–5), 1 = B (sits along holes 6–11). */
export type Player = 0 | 1;

/** 0..11, counter-clockwise round the board: the usual sowing order. */
export type HoleIndex = number;

/**
 * The rules a household may play differently. Every game carries its own, so a game that was
 * saved goes on under the rules it was started with.
 */
export interface Rules {
  /** Which way the stones are sown round the board. */
  readonly direction: 'counter-clockwise' | 'clockwise';
  /**
   * What happens when the player to move has no stones in their cups while the other still has some:
   * - `sweep`: the other player takes everything left and the round ends;
   * - `pass`: they miss their turn and the other plays on, until stones come round to them or the board is empty;
   * - `pass-above-four`: they miss their turn while more than four stones are left; the last four go to the player holding them.
   */
  readonly stranded: 'sweep' | 'pass' | 'pass-above-four';
  /** A cup brought to four while the sowing passes over it: its owner takes it, or the player sowing does. */
  readonly passingFour: 'owner' | 'sower';
  /** Who starts the next round of a full match (the other player than last time after a drawn round, either way). */
  readonly nextStarter: 'winner' | 'loser';
}

export const DEFAULT_RULES: Rules = { direction: 'counter-clockwise', stranded: 'sweep', passingFour: 'owner', nextStarter: 'winner' };

/** The choices each rule offers, the usual one first. */
export const RULE_CHOICES: { readonly [K in keyof Rules]: readonly Rules[K][] } = {
  direction: ['counter-clockwise', 'clockwise'],
  stranded: ['sweep', 'pass', 'pass-above-four'],
  passingFour: ['owner', 'sower'],
  nextStarter: ['winner', 'loser'],
};

/** Rules read back from storage or from anywhere else untrusted: each one valid, or the usual rule. */
export function normalizeRules(x: unknown): Rules {
  const given = (typeof x === 'object' && x !== null ? x : {}) as Record<string, unknown>;
  const pick = <K extends keyof Rules>(key: K): Rules[K] => ((RULE_CHOICES[key] as readonly unknown[]).includes(given[key]) ? (given[key] as Rules[K]) : DEFAULT_RULES[key]);
  return { direction: pick('direction'), stranded: pick('stranded'), passingFour: pick('passingFour'), nextStarter: pick('nextStarter') };
}

export interface RoundState {
  readonly board: readonly number[];
  readonly owners: readonly Player[];
  /** Stones taken this round. */
  readonly captured: readonly [number, number];
  readonly toMove: Player;
  /** Who started this round. */
  readonly starter: Player;
  readonly over: boolean;
  /** How often each position (board + player to move) has come up this round. */
  readonly seen: Readonly<Record<string, number>>;
  /** The rules this round is played under; absent in games saved before rules could be chosen, which means the usual ones. */
  readonly rules?: Rules;
}

export type TurnEvent =
  | { type: 'turn-start'; player: Player; hole: HoleIndex }
  | { type: 'pickup'; hole: HoleIndex; count: number; relay: boolean }
  | { type: 'drop'; hole: HoleIndex; countAfter: number }
  | { type: 'capture'; hole: HoleIndex; by: Player; rule: 'last-stone' | 'owner' }
  | { type: 'turn-end'; reason: 'empty' | 'capture' | 'loop' }
  /** The player whose turn it would be has no stones to play and misses it (the `pass` rules). */
  | { type: 'pass'; player: Player }
  | {
      type: 'round-end';
      sweptBy: Player;
      count: number;
      totals: readonly [number, number];
      /** 'repetition': the same position came back a third time (provisional rule, see positionRepeats). */
      reason: 'no-moves' | 'repetition';
    };

export class IllegalMoveError extends Error {
  override name = 'IllegalMoveError';
}
