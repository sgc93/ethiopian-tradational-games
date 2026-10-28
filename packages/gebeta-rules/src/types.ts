export const HOLES = 12;
export const STONES_PER_HOLE = 4;
export const TOTAL_STONES = 48;
export const MAX_ROUNDS = 5;

/** 0 = A (sits along holes 0–5), 1 = B (sits along holes 6–11). */
export type Player = 0 | 1;

/** 0..11, in sowing (counter-clockwise) order. */
export type HoleIndex = number;

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
}

export type TurnEvent =
  | { type: 'turn-start'; player: Player; hole: HoleIndex }
  | { type: 'pickup'; hole: HoleIndex; count: number; relay: boolean }
  | { type: 'drop'; hole: HoleIndex; countAfter: number }
  | { type: 'capture'; hole: HoleIndex; by: Player; rule: 'last-stone' | 'owner' }
  | { type: 'turn-end'; reason: 'empty' | 'capture' | 'loop' }
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
