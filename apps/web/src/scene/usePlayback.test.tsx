import { newMatch } from '@etg/gebeta-rules';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import type { Sfx } from '../audio/sfx';
import type { Session } from '../game/session';
import { usePlayback } from './usePlayback';

afterEach(cleanup);

const session = (patch: Partial<Session> = {}): Session => ({
  id: 7,
  mode: { kind: 'computer', level: 'easy' },
  match: newMatch('quick', 0),
  humanSeat: 0,
  phase: 'awaiting-move',
  turnEvents: [],
  turnId: 0,
  paused: false,
  ...patch,
});

function fakeSfx(): Sfx & { ducks: boolean[] } {
  const ducks: boolean[] = [];
  return {
    ducks,
    drop() {},
    pickup() {},
    capture() {},
    coinWhoosh() {},
    coinRing() {},
    tick() {},
    ambience() {},
    duck: (on) => void ducks.push(on),
    setEnabled() {},
    unlock() {},
  };
}

test('the ambience ducks while a move plays and comes back when the timeline is killed by a resync', () => {
  const sfx = fakeSfx();
  const positions = { current: [] };
  const base = { speed: 'normal' as const, sfx, positions, onDone() {}, onCounts() {}, onOwners() {} };
  const { rerender } = renderHook<void, Session | null>((s) => usePlayback({ ...base, session: s }), { initialProps: session() });
  // The very next turn of the same session, animating: a timeline starts and the ambience ducks.
  rerender(
    session({
      turnId: 1,
      phase: 'animating',
      turnEvents: [
        { type: 'turn-start', player: 0, hole: 0 },
        { type: 'pickup', hole: 0, count: 4, relay: false },
        { type: 'drop', hole: 1, countAfter: 5 },
      ],
    }),
  );
  expect(sfx.ducks.at(-1)).toBe(true);
  // Quit to home: the session is gone, the timeline is killed, and the ambience must come back.
  rerender(null);
  expect(sfx.ducks.at(-1)).toBe(false);
});

test('unmounting mid-move also lets the ambience back up', () => {
  const sfx = fakeSfx();
  const positions = { current: [] };
  const base = { speed: 'normal' as const, sfx, positions, onDone() {}, onCounts() {}, onOwners() {} };
  const { rerender, unmount } = renderHook<void, Session | null>((s) => usePlayback({ ...base, session: s }), { initialProps: session() });
  rerender(
    session({
      turnId: 1,
      phase: 'animating',
      turnEvents: [
        { type: 'turn-start', player: 0, hole: 0 },
        { type: 'pickup', hole: 0, count: 4, relay: false },
        { type: 'drop', hole: 1, countAfter: 5 },
      ],
    }),
  );
  expect(sfx.ducks.at(-1)).toBe(true);
  unmount();
  expect(sfx.ducks.at(-1)).toBe(false);
  vi.restoreAllMocks();
});
