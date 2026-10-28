import type { HoleIndex } from '@etg/gebeta-rules';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '../game/session';
import { LESSON_ORDER, lessonsInEvents, nextLesson, suggestMove, type LessonId } from './lessons';

export type GuideCard = LessonId | 'homes';

export interface Guide {
  active: boolean;
  /** The lesson card on screen, if any. The game is paused while one is open. */
  card: GuideCard | null;
  /** i18n key of the one-line hint before the learner's move. */
  hint: string | null;
  /** The hole whose move would show the next lesson; it pulses on the board. */
  suggested: HoleIndex | null;
  /** Cards are still waiting to be read (the result waits for them). */
  busy: boolean;
  dismiss(): void;
}

/**
 * Runs the guided first game (spec §5.4): after each turn, every lesson seen for the first time
 * gets a card, in teaching order; before the learner's move, a hint and a suggested hole.
 */
export function useGuide(session: Session | null, setPaused: (paused: boolean) => void): Guide {
  const active = session?.mode.kind === 'guided';
  const [seen, setSeen] = useState<ReadonlySet<LessonId>>(new Set());
  const [queue, setQueue] = useState<GuideCard[]>([]);
  const handled = useRef<string | null>(null);

  // A new guided session starts with nothing learned.
  const sessionId = active ? session!.id : null;
  useEffect(() => {
    setSeen(new Set());
    setQueue([]);
    handled.current = null;
  }, [sessionId]);

  useEffect(() => {
    if (!active || !session || session.phase === 'animating' || session.turnEvents.length === 0) return;
    const key = `${session.id}:${session.turnId}`;
    if (handled.current === key) return;
    handled.current = key;
    const found = lessonsInEvents(session.turnEvents);
    const fresh = LESSON_ORDER.filter((l) => found.has(l) && !seen.has(l));
    if (fresh.length === 0) return;
    setSeen(new Set([...seen, ...fresh]));
    setQueue((q) => [...q, ...fresh.flatMap((l): GuideCard[] => (l === 'round-end' ? [l, 'homes'] : [l]))]);
    setPaused(true);
  }, [active, session, seen, setPaused]);

  const dismiss = useCallback(() => {
    setQueue((q) => {
      const rest = q.slice(1);
      if (rest.length === 0) setPaused(false);
      return rest;
    });
  }, [setPaused]);

  const card = queue[0] ?? null;
  let hint: string | null = null;
  let suggested: HoleIndex | null = null;
  if (active && session && !card && session.phase === 'awaiting-move' && session.match.round.toMove === session.humanSeat) {
    const next = nextLesson(seen);
    suggested = next && next !== 'round-end' ? suggestMove(session.match.round, next) : null;
    hint = suggested !== null ? `guide.hint.${next}` : next === 'round-end' ? 'guide.hint.round-end' : 'guide.hint.any';
  }

  return { active, card, hint, suggested, busy: queue.length > 0, dismiss };
}
