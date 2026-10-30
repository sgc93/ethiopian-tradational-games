import type { HoleIndex, Player } from '@etg/gebeta-rules';
import { create } from 'zustand';

/** Moments the world reacts to. `at` is `now()`: seconds on the page's clock. */
export type FeedbackEvent =
  | { kind: 'landed'; hole: HoleIndex; at: number }
  | { kind: 'captured'; hole: HoleIndex; by: Player; at: number }
  | { kind: 'turn'; player: Player; at: number }
  /** The result: embers burst up from the fire. */
  | { kind: 'burst'; at: number };

export type StampedEvent = FeedbackEvent & { id: number };

export interface FeedbackState {
  /** Recent events, oldest first; each gets a rising `id` so an effect can tell what it has shown. */
  events: StampedEvent[];
  /** The cup under the pointer, and the one being pressed. */
  hover: HoleIndex | null;
  press: HoleIndex | null;
  push(event: FeedbackEvent): void;
  /** Drops events older than 3 s. */
  prune(now: number): void;
  setHover(hole: HoleIndex | null): void;
  setPress(hole: HoleIndex | null): void;
}

export const KEEP_SECONDS = 3;

/** Seconds on the page's clock, the time base for every feedback event. */
export const now = (): number => performance.now() / 1000;

let nextId = 1;

/** What just happened in the game, for the in-world feedback (spec §7). The playback pushes; the effects read. */
export const useFeedback = create<FeedbackState>((set, get) => ({
  events: [],
  hover: null,
  press: null,
  push: (event) => set({ events: [...get().events, { ...event, id: nextId++ }] }),
  prune: (at) => {
    const kept = get().events.filter((e) => at - e.at <= KEEP_SECONDS);
    if (kept.length !== get().events.length) set({ events: kept });
  },
  setHover: (hole) => {
    if (get().hover !== hole) set({ hover: hole });
  },
  setPress: (hole) => {
    if (get().press !== hole) set({ press: hole });
  },
}));

/** The most recent event of a kind, or null. */
export function latest<K extends FeedbackEvent['kind']>(events: readonly StampedEvent[], kind: K): Extract<StampedEvent, { kind: K }> | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!;
    if (e.kind === kind) return e as Extract<StampedEvent, { kind: K }>;
  }
  return null;
}
