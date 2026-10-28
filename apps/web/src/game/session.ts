import type { Level, MatchState, Player, TurnEvent } from '@etg/gebeta-rules';

export type Mode = { kind: 'computer'; level: Level } | { kind: 'friend' } | { kind: 'guided' };

export interface SavedSession {
  version: 1;
  mode: Mode;
  match: MatchState;
  humanSeat: Player | null;
  savedAt: number;
}

export type Phase = 'toss' | 'awaiting-move' | 'animating' | 'thinking' | 'round-summary' | 'finished';

export interface Session {
  /** Changes when a session starts, restarts or resumes, so the board knows to start afresh. */
  id: number;
  mode: Mode;
  match: MatchState;
  /** The seat a human plays; null when both seats are human (friend mode). */
  humanSeat: Player | null;
  phase: Phase;
  /** What the last move did, for the board to animate. Empty for a redeal between rounds. */
  turnEvents: TurnEvent[];
  /** Changes every time there is something new to animate. */
  turnId: number;
  paused: boolean;
}
