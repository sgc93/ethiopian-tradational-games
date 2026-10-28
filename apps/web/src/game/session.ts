import type { Level, MatchState, Player } from '@etg/gebeta-rules';

export type Mode = { kind: 'computer'; level: Level } | { kind: 'friend' } | { kind: 'guided' };

export interface SavedSession {
  version: 1;
  mode: Mode;
  match: MatchState;
  humanSeat: Player | null;
  savedAt: number;
}
