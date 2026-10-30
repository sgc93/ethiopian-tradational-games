import type { Session } from '../game/session';

type Phase = Session['phase'];

/** The HUD shows in play; it steps aside during the toss, at the result, and while a lesson card is open. */
export function hudShown({ phase, tossOpen, card }: { phase: Phase; tossOpen: boolean; card: boolean }): boolean {
  return !tossOpen && phase !== 'finished' && !card;
}

/** The menu medallion goes with the HUD during the toss and at the result, and gives way to Leave lesson in a lesson. */
export function menuShown({ phase, tossOpen, lesson }: { phase: Phase; tossOpen: boolean; lesson: boolean }): boolean {
  return !tossOpen && phase !== 'finished' && !lesson;
}
