import {
  advanceMatch,
  applyMove,
  initialOwners,
  mulberry32,
  newMatch,
  newRound,
  playMove,
  randomMove,
  type RoundState,
} from '@etg/gebeta-rules';
import { expect, test } from 'vitest';
import { StoneTracker } from './stoneTracker';

function positionAfter(seed: number): RoundState {
  const rng = mulberry32(seed);
  let s = newRound(initialOwners(), (seed % 2) as 0 | 1);
  for (let i = 0; i < seed % 30 && !s.over; i++) {
    const next = applyMove(s, randomMove(s, rng)).state;
    if (next.over) break;
    s = next;
  }
  return s;
}

test('a new tracker places every stone once, matching the round', () => {
  const r = positionAfter(7);
  const t = new StoneTracker(r);
  expect(t.locations()).toHaveLength(48);
  expect(t.holeCounts()).toEqual(r.board);
  expect(t.pileCounts()).toEqual(r.captured);
});

test('replaying a turn leaves the tracker matching the rules', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const before = positionAfter(seed);
    const { state: after, events } = applyMove(before, randomMove(before, mulberry32(seed + 1000)));
    const t = new StoneTracker(before);
    for (const e of events) t.apply(e);
    expect(t.holeCounts()).toEqual(after.board);
    expect(t.pileCounts()).toEqual(after.captured);
    expect(t.locations().filter((l) => l.kind === 'hand')).toHaveLength(0);
  }
});

test('a pickup moves the stones into the hand, a drop moves one at a time', () => {
  const t = new StoneTracker(newRound(initialOwners(), 0));
  const picked = t.apply({ type: 'pickup', hole: 0, count: 4, relay: false });
  expect(picked).toHaveLength(4);
  expect(picked.every((m) => m.to.kind === 'hand')).toBe(true);
  const dropped = t.apply({ type: 'drop', hole: 1, countAfter: 5 });
  expect(dropped).toHaveLength(1);
  expect(dropped[0]!.to).toEqual({ kind: 'hole', hole: 1, slot: 4 });
});

test('redeal puts 4 stones in every hole', () => {
  let m = newMatch('match', 0);
  const rng = mulberry32(5);
  const t = new StoneTracker(m.round);
  while (!m.round.over) {
    const played = playMove(m, randomMove(m.round, rng));
    for (const e of played.events) t.apply(e);
    m = played.match;
  }
  expect(t.holeCounts()).toEqual(Array(12).fill(0));
  const next = advanceMatch(m);
  const moves = t.redeal(next.round);
  expect(t.holeCounts()).toEqual(Array(12).fill(4));
  expect(t.pileCounts()).toEqual([0, 0]);
  expect(new Set(moves.map((mv) => mv.id)).size).toBe(48);
  const holes = t.locations().map((l) => (l.kind === 'hole' ? `${l.hole}:${l.slot}` : 'x'));
  expect(new Set(holes).size).toBe(48);
});
