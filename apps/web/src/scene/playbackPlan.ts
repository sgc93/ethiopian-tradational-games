import type { Session } from '../game/session';

export type PlaybackPlan = 'none' | 'sync' | 'sync-then-done' | 'animate';

/**
 * What the board should do with a session update, given the last turn it showed.
 * It animates only the very next turn of the same session; anything else is drawn as it stands,
 * and an animation that can't be played is still reported done so the game never hangs.
 */
export function planPlayback(
  shown: { id: number; turnId: number } | null,
  session: Pick<Session, 'id' | 'turnId' | 'phase'>,
  followingStones: boolean,
): PlaybackPlan {
  if (shown?.id === session.id && shown.turnId === session.turnId) return 'none';
  const animating = session.phase === 'animating';
  const nextTurn = shown?.id === session.id && session.turnId === shown.turnId + 1;
  if (animating && nextTurn && followingStones) return 'animate';
  return animating ? 'sync-then-done' : 'sync';
}
