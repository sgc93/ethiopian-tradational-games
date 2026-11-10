import {
  DEFAULT_RULES,
  initialOwners,
  legalMoves,
  newMatch,
  type HoleIndex,
  type MatchState,
  type Player,
  type RoundState,
} from '@etg/gebeta-rules';
import { beforeEach, expect, test } from 'vitest';
import { createController, type AiClient, type Controller } from './controller';
import type { Session, SavedSession } from './session';

/** A computer opponent whose answers the test releases by hand. */
function manualAi() {
  const pending: Array<{ state: RoundState; resolve: (h: HoleIndex) => void }> = [];
  const ai: AiClient = {
    requestMove: (state) => new Promise<HoleIndex>((resolve) => pending.push({ state, resolve })),
  };
  const answer = () => {
    const p = pending.shift();
    if (!p) throw new Error('the computer was not asked');
    p.resolve(legalMoves(p.state)[0]!);
  };
  return { ai, pending, answer };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

let saved: SavedSession[];
let cleared: number;
let ai: ReturnType<typeof manualAi>;
let last: Session | null;
let c: Controller;

/** rng 0.1 makes the coin land on lion, so calling lion means seat A (the human) starts. */
function make(rng: () => number = () => 0.1) {
  saved = [];
  cleared = 0;
  ai = manualAi();
  last = null;
  c = createController({
    ai: ai.ai,
    persistence: { save: (s) => saved.push(s), clear: () => cleared++ },
    rng,
    onChange: (s) => (last = s),
  });
}

beforeEach(() => make());

const round = (board: number[], captured: [number, number], toMove: Player, over = false): RoundState => ({
  board,
  owners: initialOwners(),
  captured,
  toMove,
  starter: 0,
  over,
  seen: {},
});

const saveOf = (match: MatchState, mode: SavedSession['mode'] = { kind: 'computer', level: 'easy' }): SavedSession => ({
  version: 1,
  mode,
  match,
  humanSeat: mode.kind === 'friend' ? null : 0,
  savedAt: 0,
});

test('computer game: toss, human move, animation, computer reply', async () => {
  c.start({ kind: 'computer', level: 'easy' }, 'quick');
  expect(c.get()?.phase).toBe('toss');
  expect(c.toss('lion')).toBe(0);
  expect(c.get()?.phase).toBe('awaiting-move');

  expect(c.playHole(0)).toBe(true);
  const s = c.get()!;
  expect(s.phase).toBe('animating');
  expect(s.turnEvents[0]).toEqual({ type: 'turn-start', player: 0, hole: 0 });
  expect(saved.at(-1)?.match).toEqual(s.match);

  c.animationDone(s.turnId);
  expect(c.get()?.phase).toBe('thinking');
  ai.answer();
  await flush();
  expect(c.get()?.phase).toBe('animating');
  expect(c.get()?.turnEvents[0]).toMatchObject({ type: 'turn-start', player: 1 });
  expect(last).toBe(c.get());
});

test('calling the coin wrong lets the computer start', () => {
  c.start({ kind: 'computer', level: 'easy' }, 'quick');
  expect(c.toss('person')).toBe(1);
  expect(c.get()?.phase).toBe('thinking');
  expect(ai.pending).toHaveLength(1);
});

test('ignores taps while animating or thinking', () => {
  c.start({ kind: 'computer', level: 'easy' }, 'quick');
  c.toss('lion');
  c.playHole(0);
  const match = c.get()!.match;
  expect(c.playHole(1)).toBe(false);
  expect(c.get()!.match).toBe(match);
  c.animationDone(c.get()!.turnId);
  expect(c.get()!.phase).toBe('thinking');
  expect(c.playHole(1)).toBe(false);
  expect(c.get()!.match).toBe(match);
});

test("ignores illegal holes and the computer's holes", () => {
  c.start({ kind: 'computer', level: 'easy' }, 'quick');
  c.toss('lion');
  expect(c.playHole(6)).toBe(false);
  expect(c.playHole(12)).toBe(false);
  expect(c.get()!.phase).toBe('awaiting-move');
});

test('friend mode lets both seats move', () => {
  c.start({ kind: 'friend' }, 'quick');
  expect(c.get()!.humanSeat).toBeNull();
  c.toss('lion');
  expect(c.playHole(0)).toBe(true);
  c.animationDone(c.get()!.turnId);
  expect(c.get()!.phase).toBe('awaiting-move');
  expect(c.playHole(legalMoves(c.get()!.match.round)[0]!)).toBe(true);
  expect(ai.pending).toHaveLength(0);
});

test('stale animationDone is ignored', () => {
  c.start({ kind: 'friend' }, 'quick');
  c.toss('lion');
  c.playHole(0);
  const id = c.get()!.turnId;
  c.animationDone(id - 1);
  expect(c.get()!.phase).toBe('animating');
  c.animationDone(id);
  c.animationDone(id);
  expect(c.get()!.phase).toBe('awaiting-move');
});

test('round end in a match goes to the round summary, then redeal', () => {
  const nearEnd: MatchState = { ...newMatch('match', 0), round: round([1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], [20, 24], 0) };
  c.resume(saveOf(nearEnd, { kind: 'friend' }));
  expect(c.get()!.phase).toBe('awaiting-move');
  c.playHole(0);
  c.animationDone(c.get()!.turnId);
  expect(c.get()!.phase).toBe('round-summary');
  expect(c.get()!.match.roundNumber).toBe(2);
  expect(c.get()!.match.history[0]?.totals).toEqual([24, 24]);
  expect(saved.at(-1)?.match.roundNumber).toBe(2);

  c.continueAfterSummary();
  expect(c.get()!.phase).toBe('animating');
  expect(c.get()!.turnEvents).toEqual([]);
  c.animationDone(c.get()!.turnId);
  expect(c.get()!.phase).toBe('awaiting-move');
  expect(c.get()!.match.round.toMove).toBe(1); // drawn round: the player who did not start round 1
});

test('finished match clears the saved session', () => {
  const nearEnd: MatchState = { ...newMatch('quick', 0), round: round([1, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0], [20, 20], 0) };
  c.resume(saveOf(nearEnd));
  c.playHole(0);
  c.animationDone(c.get()!.turnId);
  expect(c.get()!.phase).toBe('finished');
  expect(c.get()!.match.result).toEqual({ winner: 0, reason: 'quick', rounds: 1 });
  expect(cleared).toBe(1);
});

test('resume: computer to move starts thinking', () => {
  const m: MatchState = { ...newMatch('match', 1) };
  c.resume(saveOf(m));
  expect(c.get()!.phase).toBe('thinking');
  expect(ai.pending).toHaveLength(1);
});

test('resume: a round that ended before saving shows the summary', () => {
  const m: MatchState = { ...newMatch('match', 0), round: round(Array(12).fill(0), [28, 20], 1, true) };
  c.resume(saveOf(m));
  expect(c.get()!.phase).toBe('round-summary');
  expect(c.get()!.match.roundNumber).toBe(2);
});

test("pausing holds the computer's move until unpaused", async () => {
  c.start({ kind: 'computer', level: 'easy' }, 'quick');
  c.toss('person'); // the computer starts
  c.setPaused(true);
  ai.answer();
  await flush();
  expect(c.get()!.phase).toBe('thinking');
  expect(c.get()!.paused).toBe(true);
  c.setPaused(false);
  expect(c.get()!.phase).toBe('animating');
  expect(c.get()!.turnEvents[0]).toMatchObject({ type: 'turn-start', player: 1 });
});

test('quitting drops a late computer answer', async () => {
  c.start({ kind: 'computer', level: 'easy' }, 'quick');
  c.toss('person');
  c.quit();
  ai.answer();
  await flush();
  expect(c.get()).toBeNull();
  expect(last).toBeNull();
});

test('guided games are never saved and the computer plays easy', () => {
  c.start({ kind: 'guided' }, 'match');
  expect(c.get()!.phase).toBe('awaiting-move');
  expect(c.get()!.match.format).toBe('quick');
  c.playHole(0);
  expect(saved).toHaveLength(0);
});

test('restart begins the same kind of game again', () => {
  c.start({ kind: 'friend' }, 'match');
  c.toss('lion');
  c.playHole(0);
  c.restart();
  expect(c.get()!.phase).toBe('toss');
  expect(c.get()!.match.format).toBe('match');
  expect(c.get()!.mode).toEqual({ kind: 'friend' });
});

test('a game is started under the rules given, and keeps them through the toss and a restart', () => {
  const rules = { ...DEFAULT_RULES, direction: 'clockwise', stranded: 'pass' } as const;
  c.start({ kind: 'computer', level: 'easy' }, 'match', rules);
  expect(c.get()?.match.round.rules).toEqual(rules);
  c.toss('lion');
  expect(c.get()?.match.round.rules).toEqual(rules);
  // Sown clockwise from cup 2: the first stone goes to cup 1.
  expect(c.playHole(2)).toBe(true);
  expect(c.get()!.turnEvents.find((e) => e.type === 'drop')).toMatchObject({ hole: 1 });
  c.restart();
  expect(c.get()?.match.round.rules).toEqual(rules);
});

test('with no rules given a game is under the usual ones, and a lesson always is', () => {
  c.start({ kind: 'friend' }, 'quick');
  expect(c.get()?.match.round.rules).toEqual(DEFAULT_RULES);
  c.start({ kind: 'guided' }, 'quick', { ...DEFAULT_RULES, direction: 'clockwise' });
  expect(c.get()?.match.round.rules).toEqual(DEFAULT_RULES);
});
