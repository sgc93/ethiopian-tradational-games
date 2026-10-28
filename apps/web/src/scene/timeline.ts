import type { TurnEvent } from '@etg/gebeta-rules';
import type { Speed } from '../state/settings';

export const DURATION_MS = {
  normal: { pickup: 300, drop: 220, capture: 400, sweepStone: 60, redealStone: 40 },
  fast: { pickup: 110, drop: 80, capture: 150, sweepStone: 25, redealStone: 15 },
  skip: { pickup: 0, drop: 0, capture: 0, sweepStone: 0, redealStone: 0 },
} as const;

export interface TimelineStep {
  event: TurnEvent;
  atMs: number;
  durationMs: number;
}

function durationOf(event: TurnEvent, speed: Speed): number {
  const d = DURATION_MS[speed];
  switch (event.type) {
    case 'pickup':
      return d.pickup;
    case 'drop':
      return d.drop;
    case 'capture':
      return d.capture;
    case 'round-end':
      return event.count * d.sweepStone;
    default:
      return 0;
  }
}

/** When each event of a move plays, back to back in the order the rules produced them. */
export function buildTimeline(events: readonly TurnEvent[], speed: Speed): TimelineStep[] {
  let atMs = 0;
  return events.map((event) => {
    const durationMs = durationOf(event, speed);
    const step = { event, atMs, durationMs };
    atMs += durationMs;
    return step;
  });
}

export function totalDuration(steps: readonly TimelineStep[]): number {
  const last = steps.at(-1);
  return last ? last.atMs + last.durationMs : 0;
}
