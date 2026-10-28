import { applyMove, legalMoves, type HoleIndex, type RoundState, type TurnEvent } from '@etg/gebeta-rules';

export type LessonId = 'sow' | 'relay' | 'stop-empty' | 'capture-last' | 'capture-owner' | 'round-end';

/** The order the guided game teaches in (spec §5.4). */
export const LESSON_ORDER: readonly LessonId[] = ['sow', 'relay', 'stop-empty', 'capture-last', 'capture-owner', 'round-end'];

/** Which lessons a move's events show happening. */
export function lessonsInEvents(events: readonly TurnEvent[]): Set<LessonId> {
  const found = new Set<LessonId>();
  let mover: number | null = null;
  for (const e of events) {
    if (e.type === 'turn-start') mover = e.player;
    else if (e.type === 'drop') found.add('sow');
    else if (e.type === 'pickup' && e.relay) found.add('relay');
    else if (e.type === 'turn-end' && e.reason === 'empty') found.add('stop-empty');
    else if (e.type === 'capture' && e.rule === 'last-stone') found.add('capture-last');
    else if (e.type === 'capture' && e.rule === 'owner' && e.by !== mover) found.add('capture-owner');
    else if (e.type === 'round-end') found.add('round-end');
  }
  return found;
}

export function nextLesson(done: ReadonlySet<LessonId>): LessonId | null {
  return LESSON_ORDER.find((l) => !done.has(l)) ?? null;
}

/** A legal move that would show the lesson happening, or null when none would. */
export function suggestMove(state: RoundState, lesson: LessonId): HoleIndex | null {
  return legalMoves(state).find((h) => lessonsInEvents(applyMove(state, h).events).has(lesson)) ?? null;
}
