# Gebeta 3D Web Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A free, offline-capable 3D web game of 12-hole Gebeta: quick game and 5-round match, against the computer or a friend, in Amharic and English, with a guided first game.

**Architecture:**
- **`packages/gebeta-rules`** is pure TypeScript. It holds the rules, rounds, homes, the computer opponent and the simulation. Every move returns the new state plus an event list.
- **`apps/web`** is the Vite + React + React Three Fiber app.
  - A session controller drives a match.
  - The 3D scene replays each move's events as animation through a stone tracker.
  - The computer opponent runs in a Web Worker.
- Nothing in the rules package knows about React, three.js or the browser.

**Tech Stack:**
- **Shared:** pnpm workspace, TypeScript (strict), Vitest, fast-check
- **App:** React 19, Vite, three.js, @react-three/fiber, @react-three/drei, GSAP, zustand, i18next + react-i18next
- **Offline and testing:** @fontsource/noto-sans-ethiopic, vite-plugin-pwa + @vite-pwa/assets-generator, Playwright

Install the latest stable version of each package when the task runs; the lockfile records them.

**Spec:** `docs/superpowers/specs/2026-10-28-gebeta-web-prototype-design.md` (approved 2026-10-28). Read it before starting. Section numbers below (§4.2 etc.) refer to it.

**Two choices this plan makes inside the spec's "left to the builder" room:**
- **zustand** for app state.
- **Sounds synthesized with the Web Audio API instead of Howler.js and sound files.** This adds zero download bytes and avoids any licence question. Spec §7 named Howler as Claude's call, so this changes that call, not an owner decision.

## Global Constraints

- **First load:** at most 3,000,000 bytes gzip-compressed for everything precached (code, font, icons). §6
- **Frame rate:** at least 30 fps on a low-end Android phone in Chrome; 60 fps on mid-range phones and desktops. §6
- **Browsers:** current Chrome Android, Safari iOS, and desktop Chrome, Edge, Firefox and Safari.
  - WebGL 2 is required.
  - If it's missing, show the translated "no WebGL" screen instead of the game. §6
- **Offline and install:** after the first visit, everything works offline, and the app is installable. §6
- **Privacy:** no accounts, no analytics, no network calls at runtime.
  - Only settings and the current match are stored, in `localStorage`.
  - Every read and write is wrapped in try/catch. §6
- **Licences:**
  - Fonts are OFL only.
  - Textures and sounds are generated in code.
  - No downloaded media. §6
- **Capacitor-safe:** no feature may depend on the service worker or on browser-only APIs without a fallback. The service worker only adds offline caching. §6
- **Rules package boundary:** `packages/gebeta-rules` imports nothing from React, three.js, the DOM or the web app. §7
- **Text:**
  - Every user-visible string goes through i18next with both `en` and `am` keys.
  - The Ge'ez terms ገበጣ, ቤት, አንበሳ and ሰው appear in English mode too. §5.6
- **Fixed numbers from the spec:** 12 holes, 4 stones per hole, 48 stones, captures of exactly 4, `MAX_ROUNDS = 5`.
- **Tooling:** Node 26.12 and pnpm 10.28 are installed. Run every command from the repository root unless a step says otherwise.

## Review Focus

These are the five things the spec implies but no rule test covers, most likely to bite first. Each one's test lives in the task named.

1. **Double taps:** tapping a hole while stones are moving or the computer is thinking must do nothing, never play a second move. Covered in Task 8: `ignores taps while animating or thinking`.
2. **Reload mid-turn:** reloading or closing the tab mid-animation or while the computer is thinking must resume to a consistent position. The computer thinks again if it's its turn; an interrupted round end shows the summary. Covered in Task 8: `resume` tests.
3. **Bad saved data:** corrupt or old saved data, or `localStorage` throwing (private mode, some web views), must start the app fresh without crashing. Covered in Task 7: storage tests.
4. **Crowded holes:** a hole holding 20–48 stones must keep every stone inside the bowl or heaped above it, never sunk through the earth. Covered in Task 9: `stoneSlot keeps every stone in or above the bowl`.
5. **Narrow phones:** on a 360×640 portrait screen the whole board must be visible without touching the camera. Covered in Task 9: `seat camera frames the board at portrait aspect`, and in the Playwright layout test in Task 14.

---

## File Structure

```
pnpm-workspace.yaml, package.json, tsconfig.base.json, .gitignore
packages/gebeta-rules/
  package.json, tsconfig.json
  src/types.ts       constants, Player, RoundState, TurnEvent
  src/round.ts       initialOwners, newRound, legalMoves, applyMove (§4.1–4.3, 4.6)
  src/match.ts       formats, round results, homes changing hands, match end (§4.4–4.5)
  src/validate.ts    isValidMatchState (for saved games)
  src/rng.ts         mulberry32 seeded RNG
  src/ai.ts          randomMove, greedyMove, chooseMove (easy/medium/hard)
  src/simulate.ts    simulate() for the §4.6 simulation
  src/index.ts       public exports
  test/helpers.ts    roundFrom() fixture builder
  test/*.test.ts
apps/web/
  package.json, tsconfig.json, vite.config.ts, index.html, playwright.config.ts, pwa-assets.config.ts
  public/icon.svg
  scripts/check-size.mjs
  src/main.tsx, src/App.tsx, src/support.ts
  src/state/settings.ts, src/state/store.ts
  src/persistence/storage.ts
  src/i18n/index.ts, en.json, am.json
  src/game/session.ts, controller.ts, instance.ts
  src/ai/ai.worker.ts, client.ts
  src/scene/layout.ts, earthGeometry.ts, earthTexture.ts, pebbles.ts, stoneTracker.ts, timeline.ts,
            usePlayback.ts, BoardScene.tsx, Earth.tsx, Stones.tsx, HoleMarkers.tsx,
            HoleHitAreas.tsx, CountLabels.tsx, CameraRig.tsx
  src/audio/sfx.ts
  src/ui/Hud.tsx, GameMenu.tsx, CoinToss.tsx, FormatPicker.tsx, RoundSummary.tsx, HoleButtons.tsx
  src/screens/HomeScreen.tsx, AboutScreen.tsx, GameScreen.tsx, ResultScreen.tsx, NoWebGL.tsx
  src/tutorial/lessons.ts, GuidedOverlay.tsx
  e2e/play.spec.ts, offline.spec.ts, layout.spec.ts
```

Web unit tests sit next to the file they test (`foo.ts` → `foo.test.ts`).

---

### Task 1: Workspace, rules types and the starting position

**Files:**
- Create: `.gitignore`, `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`
- Create: `packages/gebeta-rules/package.json`, `packages/gebeta-rules/tsconfig.json`, `packages/gebeta-rules/src/types.ts`, `packages/gebeta-rules/src/round.ts`, `packages/gebeta-rules/src/index.ts`
- Test: `packages/gebeta-rules/test/round.test.ts`, `packages/gebeta-rules/test/helpers.ts`

**Interfaces:**
- Produces (`src/types.ts`):

```ts
export const HOLES = 12, STONES_PER_HOLE = 4, TOTAL_STONES = 48, MAX_ROUNDS = 5;
export type Player = 0 | 1;          // 0 = A (sits along holes 0–5), 1 = B (holes 6–11)
export type HoleIndex = number;      // 0..11, in sowing (counter-clockwise) order
export interface RoundState {
  readonly board: readonly number[];            // 12 counts
  readonly owners: readonly Player[];           // 12 owners
  readonly captured: readonly [number, number]; // stones taken this round
  readonly toMove: Player;
  readonly starter: Player;                     // who started this round
  readonly over: boolean;
}
export type TurnEvent =
  | { type: 'turn-start'; player: Player; hole: HoleIndex }
  | { type: 'pickup'; hole: HoleIndex; count: number; relay: boolean }
  | { type: 'drop'; hole: HoleIndex; countAfter: number }
  | { type: 'capture'; hole: HoleIndex; by: Player; rule: 'last-stone' | 'owner' }
  | { type: 'turn-end'; reason: 'empty' | 'capture' | 'loop' }
  | { type: 'round-end'; sweptBy: Player; count: number; totals: readonly [number, number] };
export class IllegalMoveError extends Error {}
```

- Produces (`src/round.ts`):
  - `initialOwners(): Player[]`
  - `newRound(owners: readonly Player[], starter: Player): RoundState`
  - `legalMoves(state: RoundState): HoleIndex[]`
- Produces (`test/helpers.ts`): `roundFrom(board: number[], captured: [number, number], toMove: Player, owners?: Player[]): RoundState`. It throws unless board total + captured = 48. Default owners come from `initialOwners()`; `starter` is 0.

- [ ] **Step 1: Initialise the repository and workspace**

```bash
git init -b main
```

- `.gitignore`: `node_modules`, `dist`, `dev-dist`, `.vite`, `coverage`, `playwright-report`, `test-results`.
- `pnpm-workspace.yaml`: `packages: ['packages/*', 'apps/*']`.
- Root `package.json`:
  - `"private": true`, `"type": "module"`
  - scripts `test` (`pnpm -r test`) and `typecheck` (`pnpm -r typecheck`)
- `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `module: "ESNext"`, `moduleResolution: "bundler"`, `target: "ES2022"`, `verbatimModuleSyntax`.
- `packages/gebeta-rules/package.json`:
  - name `@etg/gebeta-rules`
  - `"exports": { ".": "./src/index.ts" }` (no build step; Vite and Vitest consume the TypeScript source)
  - scripts `test: vitest run`, `typecheck: tsc --noEmit`
  - dev deps `vitest`, `fast-check`, `typescript`

- [ ] **Step 2: Write the failing test**

```ts
// test/round.test.ts
test('a new round has 4 stones in every hole and A owns 0–5', () => {
  const r = newRound(initialOwners(), 1);
  expect(r.board).toEqual(Array(12).fill(4));
  expect(r.owners).toEqual([0,0,0,0,0,0,1,1,1,1,1,1]);
  expect(r.captured).toEqual([0, 0]);
  expect(r.toMove).toBe(1);
  expect(r.starter).toBe(1);
  expect(r.over).toBe(false);
});
test('legal moves are the mover\'s own non-empty holes', () => {
  const r = roundFrom([0,2,0,0,0,1, 0,0,3,0,0,2], [20, 20], 0);
  expect(legalMoves(r)).toEqual([1, 5]);
  expect(legalMoves({ ...r, toMove: 1 })).toEqual([8, 11]);
});
test('legal moves follow ownership, not the physical row', () => {
  const owners: Player[] = [0,0,0,0,0,0,0,1,1,1,1,1]; // A owns hole 6 too
  const r = roundFrom([0,0,0,0,0,0, 4,0,0,0,0,4], [20, 20], 0, owners);
  expect(legalMoves(r)).toEqual([6]);
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
pnpm install
pnpm --filter @etg/gebeta-rules test
```

Expected: FAIL, because `newRound` is not defined.

- [ ] **Step 4: Implement `types.ts`, then `initialOwners`, `newRound` and `legalMoves` in `round.ts`**

Export everything from `index.ts`. State objects are plain frozen-by-convention data (no classes), so they serialise to JSON.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
pnpm --filter @etg/gebeta-rules test
```

Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: workspace and gebeta-rules starting position"
```

The first commit includes `docs/`.

---

### Task 2: A turn — sowing, relay, captures and endless turns (§4.2, §4.6)

**Files:**
- Modify: `packages/gebeta-rules/src/round.ts`
- Test: `packages/gebeta-rules/test/turn.test.ts`

**Interfaces:**
- Consumes: Task 1 types, `roundFrom`.
- Produces: `applyMove(state: RoundState, hole: HoleIndex): { state: RoundState; events: TurnEvent[] }`.
  - It throws `IllegalMoveError` when `state.over` is true or `hole` is not in `legalMoves(state)`.
  - After the turn, `toMove` switches to the other player. Round-end handling is Task 3; in this task assume the next player still has stones.

The sowing loop follows the spec exactly. It is written out here because the order of the checks decides the outcome:

```
events.push(turn-start)
seen = { key(board, hole) }            // key = board.join(',') + '|' + hole
hand = board[hole]; board[hole] = 0; events.push(pickup relay:false)
pos = hole
loop:
  pos = (pos + 1) % 12; board[pos]++; hand--; events.push(drop pos countAfter)
  if hand > 0:
    if board[pos] == 4: captured[owners[pos]] += 4; board[pos] = 0; events.push(capture by owner, rule 'owner')
    continue
  if board[pos] == 4: captured[mover] += 4; board[pos] = 0; events.push(capture by mover, 'last-stone'); events.push(turn-end 'capture'); break
  if board[pos] == 1: events.push(turn-end 'empty'); break
  if key(board, pos) in seen: events.push(turn-end 'loop'); break      // stones stay where they are
  seen.add(key(board, pos)); hand = board[pos]; board[pos] = 0; events.push(pickup relay:true)
```

- [ ] **Step 1: Write the failing tests**

Each board is `[A's holes 0–5, B's holes 6–11]`. Each `captured` makes the total 48.

```ts
test('last stone into an empty hole ends the turn', () => {
  const { state, events } = applyMove(roundFrom([0,0,1,0,0,0, 0,0,3,0,0,0], [20,24], 0), 2);
  expect(state.board).toEqual([0,0,0,1,0,0, 0,0,3,0,0,0]);
  expect(state.toMove).toBe(1);
  expect(events.map(e => e.type)).toEqual(['turn-start','pickup','drop','turn-end']);
  expect(events.at(-1)).toEqual({ type: 'turn-end', reason: 'empty' });
});
test('last stone making 4 on the opponent\'s side is taken by the mover', () => {
  const { state, events } = applyMove(roundFrom([0,0,0,0,0,1, 3,0,0,4,0,0], [20,20], 0), 5);
  expect(state.board).toEqual([0,0,0,0,0,0, 0,0,0,4,0,0]);
  expect(state.captured).toEqual([24, 20]);
  expect(events).toContainEqual({ type: 'capture', hole: 6, by: 0, rule: 'last-stone' });
});
test('a hole reaching 4 mid-sowing goes to its owner, even on the mover\'s turn', () => {
  const { state, events } = applyMove(roundFrom([0,0,0,0,3,1, 3,0,0,0,1,0], [20,20], 0), 4);
  expect(state.board).toEqual([0,0,0,0,0,2, 0,1,0,0,1,0]);
  expect(state.captured).toEqual([20, 24]);
  expect(events).toContainEqual({ type: 'capture', hole: 6, by: 1, rule: 'owner' });
});
test('last stone into an occupied hole picks it up and carries on', () => {
  const { state, events } = applyMove(roundFrom([1,1,0,0,0,0, 0,2,0,0,0,0], [20,24], 0), 0);
  expect(state.board).toEqual([0,0,1,1,0,0, 0,2,0,0,0,0]);
  expect(events).toContainEqual({ type: 'pickup', hole: 1, count: 2, relay: true });
});
test('a sowing that goes all the way round does not skip its starting hole', () => {
  const { state, events } = applyMove(roundFrom([12,0,0,0,0,0, 0,0,0,0,0,0], [16,20], 0), 0);
  expect(state.board).toEqual(Array(12).fill(1));
  expect(events.at(-2)).toEqual({ type: 'drop', hole: 0, countAfter: 1 });
});
test('opening move from hole 0', () => {
  const { state, events } = applyMove(newRound(initialOwners(), 0), 0);
  expect(state.board).toEqual([2,7,1,6,1,6, 6,6,0,1,6,6]);
  expect(state.captured).toEqual([0, 0]);
  expect(events.filter(e => e.type === 'pickup')).toHaveLength(5);
  expect(events.filter(e => e.type === 'drop')).toHaveLength(26);
});
test('an endless turn ends where the repeat is found (spec §4.6 example)', () => {
  const start = roundFrom([2,1,0,2,1,0, 1,2,0,2,1,0], [16,20], 1);
  const { state, events } = applyMove(start, 7);
  expect(events.at(-1)).toEqual({ type: 'turn-end', reason: 'loop' });
  expect(events.filter(e => e.type === 'pickup' && e.relay)).toHaveLength(59);
  expect(state.board).toEqual([2,1,0,2,1,0, 1,2,0,2,1,0]);
  expect(state.captured).toEqual([16, 20]);
  expect(state.toMove).toBe(0);
});
test('illegal moves throw', () => {
  const r = roundFrom([0,2,0,0,0,1, 0,0,3,0,0,2], [20,20], 0);
  expect(() => applyMove(r, 0)).toThrow(IllegalMoveError);  // empty
  expect(() => applyMove(r, 8)).toThrow(IllegalMoveError);  // opponent's hole
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/gebeta-rules test turn
```

Expected: FAIL, because `applyMove` is not defined.

- [ ] **Step 3: Implement `applyMove` in `round.ts` with the loop above**

Copy `board` and `captured`; never mutate the input state.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/gebeta-rules test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(rules): sowing, relay, captures, endless-turn stop"
```

---

### Task 3: End of a round (§4.3)

**Files:**
- Modify: `packages/gebeta-rules/src/round.ts`
- Test: `packages/gebeta-rules/test/roundEnd.test.ts`

**Interfaces:**
- Changes: `applyMove` now ends the round when the player to move next owns no stones.
  - It sets `over: true`.
  - It adds every stone left on the board to the other player's `captured` and empties the board.
  - It appends `{ type: 'round-end', sweptBy, count, totals }` after `turn-end`.

- [ ] **Step 1: Write the failing tests**

```ts
test('round ends when the next player has no stones; the other sweeps the board', () => {
  const { state, events } = applyMove(roundFrom([1,0,3,0,0,0, 0,0,0,0,0,0], [20,24], 0), 0);
  expect(state.over).toBe(true);
  expect(state.board).toEqual(Array(12).fill(0));
  expect(state.captured).toEqual([24, 24]);   // a drawn round
  expect(events.at(-1)).toEqual({ type: 'round-end', sweptBy: 0, count: 4, totals: [24, 24] });
});
test('a sweep can win the round', () => {
  const { state } = applyMove(roundFrom([1,0,3,4,0,0, 0,0,0,0,0,0], [20,20], 0), 0);
  expect(state.captured).toEqual([28, 20]);
});
test('round goes on while the next player owns stones', () => {
  const { state } = applyMove(roundFrom([0,0,1,0,0,0, 0,0,3,0,0,0], [20,24], 0), 2);
  expect(state.over).toBe(false);
});
test('no moves are legal once the round is over', () => {
  const { state } = applyMove(roundFrom([1,0,3,0,0,0, 0,0,0,0,0,0], [20,24], 0), 0);
  expect(legalMoves(state)).toEqual([]);
  expect(() => applyMove(state, 1)).toThrow(IllegalMoveError);
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/gebeta-rules test roundEnd
```

Expected: the first two tests FAIL.

- [ ] **Step 3: Implement the end-of-turn round check in `applyMove`; `legalMoves` returns `[]` when `over`**

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/gebeta-rules test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(rules): round end and sweep"
```

---

### Task 4: Formats, homes changing hands, match end (§4.4, §4.5)

**Files:**
- Create: `packages/gebeta-rules/src/match.ts`, `packages/gebeta-rules/src/validate.ts`
- Test: `packages/gebeta-rules/test/match.test.ts`

**Interfaces:**
- Produces:

```ts
export type Format = 'quick' | 'match';
export interface RoundResult { readonly totals: readonly [number, number]; readonly winner: Player | null; readonly starter: Player }
export interface MatchResult { readonly winner: Player | null; readonly reason: 'quick' | 'no-homes' | 'round-limit'; readonly rounds: number }
export interface MatchState {
  readonly format: Format;
  readonly roundNumber: number;            // 1-based; > MAX_ROUNDS means an extra round
  readonly round: RoundState;
  readonly history: readonly RoundResult[];
  readonly result: MatchResult | null;
}
export function newMatch(format: Format, firstPlayer: Player): MatchState;
export function playMove(match: MatchState, hole: HoleIndex): { match: MatchState; events: TurnEvent[] };
export function roundResult(round: RoundState): RoundResult;          // requires round.over
export function ownersForNextRound(result: RoundResult): Player[];
export function nextStarter(result: RoundResult): Player;
export function homesOf(owners: readonly Player[], player: Player): number;
export function advanceMatch(match: MatchState): MatchState;          // requires round.over && !result
export function isValidMatchState(x: unknown): x is MatchState;      // in validate.ts
```

- `advanceMatch` decision order:
  1. Append `roundResult` to `history`.
  2. If `quick`: set the result (winner, `'quick'`, 1).
  3. Else if a total is 0: that player loses (`'no-homes'`).
  4. Else if `roundNumber >= MAX_ROUNDS` and the round is not drawn: the round winner wins (`'round-limit'`).
  5. Otherwise start round `roundNumber + 1` with `newRound(ownersForNextRound(r), nextStarter(r))`.
- `isValidMatchState` checks:
  - the shape and types
  - 12 holes and 12 owners
  - board + captured = 48
  - captured are multiples of 4
  - `roundNumber >= 1`

- [ ] **Step 1: Write the failing tests**

```ts
const done = (totals: [number, number], starter: Player = 0): RoundState =>
  ({ board: Array(12).fill(0), owners: initialOwners(), captured: totals, toMove: 1, starter, over: true });
test('A winning 28–20 takes hole 6', () =>
  expect(ownersForNextRound(roundResult(done([28, 20])))).toEqual([0,0,0,0,0,0,0,1,1,1,1,1]));
test('B winning 28–20 takes hole 0', () =>
  expect(ownersForNextRound(roundResult(done([20, 28])))).toEqual([1,0,0,0,0,0,1,1,1,1,1,1]));
test('B winning 32–16 takes holes 0 and 1', () =>
  expect(ownersForNextRound(roundResult(done([16, 32])))).toEqual([1,1,0,0,0,0,1,1,1,1,1,1]));
test('A winning 44–4 leaves B only hole 11', () =>
  expect(ownersForNextRound(roundResult(done([44, 4])))).toEqual([0,0,0,0,0,0,0,0,0,0,0,1]));
test('a drawn round resets to six each, and the other player starts', () => {
  const r = roundResult(done([24, 24], 0));
  expect(r.winner).toBeNull();
  expect(ownersForNextRound(r)).toEqual(initialOwners());
  expect(nextStarter(r)).toBe(1);
});
test('the round winner starts the next round', () => expect(nextStarter(roundResult(done([20, 28], 0)))).toBe(1));

const atRoundEnd = (m: MatchState, totals: [number, number]): MatchState =>
  ({ ...m, round: done(totals, m.round.starter) });
test('quick game: one round decides it', () => {
  expect(advanceMatch(atRoundEnd(newMatch('quick', 0), [28, 20])).result)
    .toEqual({ winner: 0, reason: 'quick', rounds: 1 });
  expect(advanceMatch(atRoundEnd(newMatch('quick', 0), [24, 24])).result)
    .toEqual({ winner: null, reason: 'quick', rounds: 1 });
});
test('match: round 1 result sets up round 2 with homes moved', () => {
  const m = advanceMatch(atRoundEnd(newMatch('match', 1), [20, 28]));
  expect(m.result).toBeNull();
  expect(m.roundNumber).toBe(2);
  expect(m.round.owners).toEqual([1,0,0,0,0,0,1,1,1,1,1,1]);
  expect(m.round.board).toEqual(Array(12).fill(4));
  expect(m.round.toMove).toBe(1);
  expect(homesOf(m.round.owners, 1)).toBe(7);
});
test('match: a player with no homes loses at once', () => {
  const m = { ...newMatch('match', 0), roundNumber: 2 };
  expect(advanceMatch(atRoundEnd(m, [48, 0])).result).toEqual({ winner: 0, reason: 'no-homes', rounds: 2 });
});
test('match: round 5 decides it', () => {
  const m = { ...newMatch('match', 0), roundNumber: 5 };
  expect(advanceMatch(atRoundEnd(m, [20, 28])).result).toEqual({ winner: 1, reason: 'round-limit', rounds: 5 });
});
test('match: a drawn round 5 leads to an extra round', () => {
  const m = advanceMatch(atRoundEnd({ ...newMatch('match', 0), roundNumber: 5 }, [24, 24]));
  expect(m.result).toBeNull();
  expect(m.roundNumber).toBe(6);
  expect(m.round.toMove).toBe(1);
});
test('isValidMatchState accepts real states and rejects broken ones', () => {
  expect(isValidMatchState(newMatch('match', 0))).toBe(true);
  expect(isValidMatchState(JSON.parse(JSON.stringify(newMatch('quick', 1))))).toBe(true);
  expect(isValidMatchState({ ...newMatch('match', 0), round: { ...newMatch('match', 0).round, board: Array(12).fill(3) } })).toBe(false);
  expect(isValidMatchState(null)).toBe(false);
  expect(isValidMatchState({ format: 'match' })).toBe(false);
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/gebeta-rules test match
```

Expected: FAIL, because these are not defined.

- [ ] **Step 3: Implement `match.ts` and `validate.ts`**

Ownership: the winner `w` gets `h = totals[w] / 4` holes. `owners[(start + i) % 12] = i < h ? w : 1 - w`, where `start = w === 0 ? 0 : 6`.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/gebeta-rules test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/gebeta-rules
git commit -m "feat(rules): quick game, match rounds, homes changing hands"
```

---

### Task 5: The computer opponent (§5.5)

**Files:**
- Create: `packages/gebeta-rules/src/rng.ts`, `packages/gebeta-rules/src/ai.ts`
- Test: `packages/gebeta-rules/test/ai.test.ts`

**Interfaces:**
- Produces:

```ts
export function mulberry32(seed: number): () => number;     // floats in [0, 1)
export type Level = 'easy' | 'medium' | 'hard';
export type Strategy = (state: RoundState, rng: () => number) => HoleIndex;
export const randomMove: Strategy;
export const greedyMove: Strategy;   // maximises (own captures − opponent captures) this turn; ties broken by rng
export interface ChooseOptions { rng?: () => number; deadlineMs?: number; now?: () => number }
export function chooseMove(state: RoundState, level: Level, opts?: ChooseOptions): HoleIndex;
```

- **Easy:** `greedyMove` half the time, `randomMove` otherwise.
- **Medium:** a fixed 2-turn lookahead (own move, opponent's best reply) scored on captured difference.
- **Hard:** iterative-deepening alpha-beta over whole turns, up to 10 turns deep. It stops at `deadlineMs`, which defaults to 900 ms of wall-clock time, and returns the best move from the last completed depth. A round-end state is terminal and scored on final totals. The evaluation function is the builder's choice.
- Playing to win the match is the same as playing to win each round's stones, so no match-level logic is needed.

- [ ] **Step 1: Write the failing tests**

`playQuick(a, b, seed, aStarts)` is a test helper: it plays one round from `newRound(initialOwners(), …)` with strategy `a` as player 0 and returns `roundResult`.

```ts
const asStrategy = (level: Level): Strategy => (s, rng) => chooseMove(s, level, { rng });
const winRate = (a: Strategy, b: Strategy, games: number) => { /* alternate starts, seeds 1..games; wins / decisive games for a */ };
test('mulberry32 is deterministic', () => expect(mulberry32(7)()).toBe(mulberry32(7)()));
test('every level returns a legal move', () => {
  const s = newRound(initialOwners(), 0);
  for (const l of ['easy','medium','hard'] as const) expect(legalMoves(s)).toContain(chooseMove(s, l, { rng: mulberry32(1) }));
});
test('medium beats random', () => expect(winRate(asStrategy('medium'), randomMove, 200)).toBeGreaterThanOrEqual(0.85));
test('hard beats greedy', () => expect(winRate(asStrategy('hard'), greedyMove, 200)).toBeGreaterThanOrEqual(0.65));
test('easy is beatable', () => expect(winRate(asStrategy('easy'), greedyMove, 200)).toBeLessThanOrEqual(0.5));
test('hard respects its deadline', () => {
  const s = /* a mid-round position reached by 10 random moves with seed 3 */;
  const t0 = performance.now(); chooseMove(s, 'hard', { rng: mulberry32(1) });
  expect(performance.now() - t0).toBeLessThan(1000);
});
```

For the strength tests, give the hard level `deadlineMs: 150` so the suite stays fast. If a strength threshold can't be met, report the measured rates to the owner instead of lowering the threshold.

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/gebeta-rules test ai
```

Expected: FAIL, because these are not defined.

- [ ] **Step 3: Implement `rng.ts` and `ai.ts`**

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/gebeta-rules test
```

Expected: all pass. Note the measured win rates in the commit message.

- [ ] **Step 5: Commit**

```bash
git add packages/gebeta-rules
git commit -m "feat(rules): easy, medium and hard computer opponents"
```

---

### Task 6: Invariants and the simulation (§4.6, §7)

**Files:**
- Create: `packages/gebeta-rules/src/simulate.ts`
- Test: `packages/gebeta-rules/test/properties.test.ts`, `packages/gebeta-rules/test/simulate.test.ts`

**Interfaces:**
- Produces:

```ts
export interface SimStats { matches: number; roundsPerMatch: number[]; turnsPerRound: number[]; loops: number; unfinishedRounds: number; unfinishedMatches: number }
export function simulate(opts: { matches: number; format: Format; players: [Strategy, Strategy]; seed: number; maxTurnsPerRound?: number /* default 5000 */ }): SimStats;
```

- [ ] **Step 1: Write the failing tests**

```ts
// properties.test.ts — fast-check, numRuns 300
// arbitrary: { seed: integer, moves: 0..400, format }; play random legal moves from newMatch, calling advanceMatch at each round end
// after every move assert:
//   sum(board) + captured[0] + captured[1] === 48
//   captured values are multiples of 4
//   owners has length 12, every entry is 0 or 1
// after every advanceMatch that starts a new round assert:
//   homesOf(owners,0) + homesOf(owners,1) === 12 and board is all 4s
//   isValidMatchState(match) === true

// simulate.test.ts
test('random vs random full matches all finish', () => {
  const s = simulate({ matches: 2000, format: 'match', players: [randomMove, randomMove], seed: 1 });
  expect(s.unfinishedRounds).toBe(0);
  expect(s.unfinishedMatches).toBe(0);
  expect(Math.max(...s.roundsPerMatch)).toBeLessThanOrEqual(15);
  console.table(summary(s));     // median / 90th percentile / max of rounds and turns, loop count
});
test('greedy vs greedy full matches all finish', () => {
  const s = simulate({ matches: 300, format: 'match', players: [greedyMove, greedyMove], seed: 2 });
  expect(s.unfinishedRounds).toBe(0);
  expect(s.unfinishedMatches).toBe(0);
  console.table(summary(s));
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/gebeta-rules test simulate properties
```

Expected: FAIL, because `simulate` is not defined.

- [ ] **Step 3: Implement `simulate.ts`**

Count a loop whenever a turn ends with `reason: 'loop'`. Count a round as unfinished if it passes `maxTurnsPerRound`.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/gebeta-rules test
```

Expected: all pass, with the printed tables.

**If `unfinishedRounds > 0`, stop and bring the example to the owner.** The spec has no rule for a round that never ends.

- [ ] **Step 5: Commit**

```bash
git add packages/gebeta-rules
git commit -m "test(rules): invariants and match simulation"
```

---

### Task 7: Web app shell — languages, settings, saved data, home and about screens

**Files:**
- Create: `apps/web/package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/support.ts`
- Create: `src/state/settings.ts`, `src/state/store.ts`, `src/game/session.ts` (the `Mode` and `SavedSession` types only)
- Create: `src/persistence/storage.ts`
- Create: `src/i18n/index.ts`, `en.json`, `am.json`
- Create: `src/screens/HomeScreen.tsx`, `AboutScreen.tsx`, `NoWebGL.tsx`
- Test: `src/persistence/storage.test.ts`, `src/i18n/i18n.test.ts`, `src/support.test.ts`, `src/state/settings.test.ts`

**Interfaces:**
- Consumes: `@etg/gebeta-rules` (`workspace:*`): `MatchState`, `Level`, `Player`, `isValidMatchState`.
- Produces:

```ts
// state/settings.ts
export type Language = 'am' | 'en'; export type Speed = 'normal' | 'fast' | 'skip';
export interface Settings { language: Language; sound: boolean; speed: Speed; showCounts: boolean; fixedCamera: boolean }
export function defaultSettings(env: { languages: readonly string[]; reducedMotion: boolean }): Settings;
// language 'am' if any entry starts with 'am', else 'en'; speed 'fast' if reducedMotion else 'normal'; sound true; showCounts true; fixedCamera false
// game/session.ts (types only in this task)
export type Mode = { kind: 'computer'; level: Level } | { kind: 'friend' } | { kind: 'guided' };
export interface SavedSession { version: 1; mode: Mode; match: MatchState; humanSeat: Player | null; savedAt: number }
// persistence/storage.ts — keys 'gebeta.settings.v1' and 'gebeta.session.v1'
export function loadSettings(fallback: Settings, store?: Storage): Settings;
export function saveSettings(s: Settings, store?: Storage): void;
export function loadSession(store?: Storage): SavedSession | null;     // null on missing, unparsable, wrong version, invalid match, finished match or guided mode
export function saveSession(s: SavedSession, store?: Storage): void;
export function clearSession(store?: Storage): void;
// support.ts
export function supportsWebGL2(doc?: Document): boolean;
// state/store.ts (zustand)
export type Screen = 'home' | 'about' | 'game' | 'result';
export interface AppStore { screen: Screen; settings: Settings; setScreen(s: Screen): void; updateSettings(p: Partial<Settings>): void }
```

- Setup:
  - Vite with `@vitejs/plugin-react`.
  - Vitest uses the `jsdom` environment.
  - `vite.config.ts` sets `worker.format: 'es'`.
  - `main.tsx` imports `@fontsource/noto-sans-ethiopic/400.css` and `/600.css`.
  - The CSS font stack is `'Noto Sans Ethiopic', system-ui, sans-serif`.
- Home screen:
  - Title ገበጣ / Gebeta.
  - Buttons: play against the computer; play with a friend; learn to play; about Gebeta; language toggle (አማርኛ / English); sound toggle.
  - The game buttons do nothing yet; Task 11 wires them up.
- About screen: one short screen, in both languages, saying:
  - Gebeta is played across Ethiopia.
  - The 12-hole version has two rows of six.
  - Children scoop the holes into the earth and play with small pebbles.
  - Captures are made in fours, called ቤት (homes).

  Use no historical claims beyond these.

- [ ] **Step 1: Write the failing tests**

```ts
test('defaults follow the device', () => {
  expect(defaultSettings({ languages: ['am-ET', 'en'], reducedMotion: false }).language).toBe('am');
  expect(defaultSettings({ languages: ['fr-FR'], reducedMotion: true })).toEqual(
    { language: 'en', sound: true, speed: 'fast', showCounts: true, fixedCamera: false });
});
test('settings round-trip and survive garbage', () => {
  const m = memoryStorage(); const d = defaultSettings({ languages: ['en'], reducedMotion: false });
  saveSettings({ ...d, sound: false }, m); expect(loadSettings(d, m).sound).toBe(false);
  m.setItem('gebeta.settings.v1', '{not json'); expect(loadSettings(d, m)).toEqual(d);
});
test('a throwing storage never crashes', () => {
  const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } } as unknown as Storage;
  expect(loadSession(bad)).toBeNull(); expect(() => saveSession(sample(), bad)).not.toThrow(); expect(() => clearSession(bad)).not.toThrow();
});
test('invalid, old-version, finished or guided sessions are not resumed', () => {
  const m = memoryStorage();
  m.setItem('gebeta.session.v1', JSON.stringify({ ...sample(), version: 0 })); expect(loadSession(m)).toBeNull();
  m.setItem('gebeta.session.v1', JSON.stringify({ ...sample(), match: { format: 'match' } })); expect(loadSession(m)).toBeNull();
  saveSession({ ...sample(), mode: { kind: 'guided' } }, m); expect(loadSession(m)).toBeNull();
  saveSession(sample(), m); expect(loadSession(m)?.match).toEqual(sample().match);
});
test('en and am have exactly the same keys, none empty', () => { /* flatten both JSON files and compare key sets; every value non-empty */ });
test('Ge\'ez game terms appear in the English strings', () => {
  const s = JSON.stringify(en); for (const w of ['ገበጣ','ቤት','አንበሳ','ሰው']) expect(s).toContain(w);
});
test('supportsWebGL2 is false when no context is available', () => {
  const doc = { createElement: () => ({ getContext: () => null }) } as unknown as Document;
  expect(supportsWebGL2(doc)).toBe(false);
});
```

`memoryStorage()` and `sample()` are small helpers in the test file: an in-memory `Storage`, and a `SavedSession` built on `newMatch('match', 0)` with mode `{ kind: 'computer', level: 'easy' }`.

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm install
pnpm --filter @etg/web test
```

Expected: FAIL, because the modules are missing.

- [ ] **Step 3: Implement the modules and the screens**

`App.tsx` shows `NoWebGL` when `supportsWebGL2()` is false; otherwise it shows the screen from the store. Changing the language calls `i18n.changeLanguage` and saves the settings. Write the Amharic strings in `am.json`; the owner reviews them in Task 15.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/web test
pnpm --filter @etg/web typecheck
```

Expected: all pass, with no type errors.

- [ ] **Step 5: Check it in the browser**

Run `pnpm --filter @etg/web dev` and open `http://localhost:5173`. The home screen renders in English. The language toggle switches every label to Amharic in Noto Sans Ethiopic, and the choice survives a reload.

- [ ] **Step 6: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): app shell, languages, settings and saved data"
```

---

### Task 8: Session controller and the computer worker

**Files:**
- Modify: `apps/web/src/game/session.ts` (add `Phase` and `Session`)
- Create: `apps/web/src/game/controller.ts`, `instance.ts`
- Create: `apps/web/src/ai/ai.worker.ts`, `client.ts`
- Test: `apps/web/src/game/controller.test.ts`

**Interfaces:**
- Consumes: rules `newMatch`, `playMove`, `advanceMatch`, `legalMoves`, `chooseMove`; Task 7 `Mode`, `SavedSession`, `saveSession`, `clearSession`.
- Produces:

```ts
// session.ts
export type Phase = 'toss' | 'awaiting-move' | 'animating' | 'thinking' | 'round-summary' | 'finished';
export interface Session { mode: Mode; match: MatchState; humanSeat: Player | null; phase: Phase; turnEvents: TurnEvent[]; turnId: number; paused: boolean }
// controller.ts
export interface AiClient { requestMove(state: RoundState, level: Level): Promise<HoleIndex> }
export interface SessionPersistence { save(s: SavedSession): void; clear(): void }
export interface Controller {
  start(mode: Mode, format: Format): void;       // computer/friend → phase 'toss'; guided → quick format, A starts, 'awaiting-move'
  toss(call: 'lion' | 'person'): Player;         // coin = rng() < 0.5 ? 'lion' : 'person'; caller is seat 0; returns the starter
  playHole(hole: HoleIndex): boolean;            // true only if the move was played
  animationDone(turnId: number): void;           // stale turnIds are ignored
  continueAfterSummary(): void;                  // 'round-summary' → 'animating' (redeal, empty turnEvents, new turnId)
  setPaused(paused: boolean): void;
  resume(saved: SavedSession): void;
  restart(): void; quit(): void;
  get(): Session | null;
}
export function createController(deps: { ai: AiClient; persistence: SessionPersistence; rng: () => number; onChange: (s: Session | null) => void }): Controller;
// ai/client.ts
export function createWorkerAi(minThinkMs?: number /* default 600 */): AiClient;   // posts { state, level, seed } to ai.worker.ts
```

- **Seats:** computer mode has `humanSeat = 0`; friend mode has `null`, so both seats are human; guided mode has `0`.
- **Phase flow:**
  1. A legal `playHole` calls `playMove`. The session gets `turnEvents`, a new `turnId` and phase `'animating'`, and is saved.
  2. `animationDone(turnId)` then:
     - if the round is over, calls `advanceMatch` and saves. If there's a result: `'finished'` and the saved session is cleared. Otherwise: `'round-summary'`.
     - else if the computer is to move: `'thinking'`, then calls `ai.requestMove` and plays the returned hole as above. If the session is paused when the answer arrives, it holds the answer until unpaused.
     - else: `'awaiting-move'`.
- **`resume`:**
  - round over → advance → summary or finished
  - computer to move → `'thinking'`
  - otherwise → `'awaiting-move'`
- `instance.ts` creates the app's single controller with `createWorkerAi()`, storage persistence and `Math.random`. It mirrors `onChange` into a zustand `useSession` store.

- [ ] **Step 1: Write the failing tests**

Use a fake `AiClient` whose `requestMove` resolves with `legalMoves(state)[0]`, plus a recording persistence and `mulberry32(1)`.

```ts
test('computer game: toss, human move, animation, computer reply', async () => { /* start computer easy quick; toss; if human starts, playHole(first legal) is true and phase is 'animating'; animationDone → 'thinking' → (await) 'animating' with the computer's events */ });
test('ignores taps while animating or thinking', () => { /* after a playHole: a second playHole returns false and match is unchanged; the same while 'thinking' */ });
test('ignores illegal holes and the computer\'s holes', () => { /* playHole(6) when A to move returns false */ });
test('friend mode lets both seats move', () => { /* both players' moves accepted in turn */ });
test('stale animationDone is ignored', () => { /* animationDone(oldId) does not change the phase */ });
test('round end in a match goes to the round summary, then redeal', () => { /* drive with a stub match one move from round end; after animationDone, phase 'round-summary'; continueAfterSummary → 'animating' with turnEvents [] and roundNumber 2 */ });
test('finished match clears the saved session', () => { /* quick game to its end: phase 'finished'; persistence.clear called */ });
test('resume: computer to move starts thinking', () => { /* resume a saved session with toMove = 1 in computer mode → phase 'thinking' and ai.requestMove called */ });
test('resume: a round that ended before saving shows the summary', () => { /* saved match with round.over true → phase 'round-summary', roundNumber advanced */ });
test('pausing holds the computer\'s move until unpaused', async () => { /* setPaused(true) before the AI resolves → phase stays 'thinking'; setPaused(false) → 'animating' */ });
```

For "stub match one move from round end", build a `MatchState` whose round is `roundFrom([1,0,3,0,0,0, 0,0,0,0,0,0], [20,24], 0)` (Task 3's first position) in `'match'` format.

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/web test controller
```

Expected: FAIL, because `createController` is not defined.

- [ ] **Step 3: Implement the controller, the worker and the client**

The worker imports `chooseMove` and `mulberry32` from the rules package and answers `{ hole }`.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/web test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): session controller and computer worker"
```

---

### Task 9: The 3D board — earth, holes, pebbles, ownership, camera, tapping

**Files:**
- Create: `apps/web/src/scene/layout.ts`, `earthGeometry.ts`, `earthTexture.ts`, `pebbles.ts`, `stoneTracker.ts`
- Create: `apps/web/src/scene/BoardScene.tsx`, `Earth.tsx`, `Stones.tsx`, `HoleMarkers.tsx`, `HoleHitAreas.tsx`, `CountLabels.tsx`, `CameraRig.tsx`
- Create: `apps/web/src/screens/GameScreen.tsx`
- Test: `apps/web/src/scene/layout.test.ts`, `stoneTracker.test.ts`, `earthGeometry.test.ts`, `pebbles.test.ts`

**Interfaces:**
- Consumes: Task 8 `Session` and `Controller`; rules types.
- Produces:

```ts
// layout.ts — world units, y up; A sits at +z, B at −z
export const HOLE_SPACING = 1.0, ROW_GAP = 1.15, HOLE_RADIUS = 0.4, HOLE_DEPTH = 0.22, STONE_SIZE = 0.09;
export type Vec3 = [number, number, number];
export function holeCenter(hole: HoleIndex): Vec3;   // hole 0 at x=−2.5, z=+ROW_GAP/2 … hole 5 at x=+2.5; hole 6 at x=+2.5, z=−ROW_GAP/2 … hole 11 at x=−2.5
export function stoneSlot(hole: HoleIndex, slot: number): Vec3;   // deterministic packing: rings in the bowl, then layers heaping upward
export function pileSlot(player: Player, index: number): Vec3;    // beside the player's row, in visible groups of 4
export function handSlot(hole: HoleIndex, index: number): Vec3;   // just above the hole, where picked-up stones are held
export function seatCamera(player: Player, aspect: number): { position: Vec3; target: Vec3; fov: number };
// stoneTracker.ts
export type StoneLocation = { kind: 'hole'; hole: HoleIndex; slot: number } | { kind: 'hand'; index: number } | { kind: 'pile'; player: Player; index: number };
export interface StoneMove { id: number; to: StoneLocation; event: TurnEvent }
export class StoneTracker {
  constructor(round: RoundState);          // stone ids 0..47: board stones hole by hole, then pile stones for A, then B
  apply(event: TurnEvent): StoneMove[];    // pickup → hand; drop → one stone hand→hole; capture → 4 stones hole→pile; round-end → board→sweeper's pile
  redeal(next: RoundState): StoneMove[];   // every stone back to the holes, 4 each
  locations(): readonly StoneLocation[];
  holeCounts(): number[];
}
// earthGeometry.ts
export function buildEarthGeometry(opts?: { width?: number; depth?: number; segments?: number; seed?: number }): THREE.BufferGeometry;  // a plane with 12 scooped half-sphere bowls and a slight raised lip
// pebbles.ts
export function makePebbleGeometries(count: number, seed: number): THREE.BufferGeometry[];  // noise-displaced, flattened icosahedra about STONE_SIZE across
export const PEBBLE_COLOURS: readonly string[];    // greys, browns and a few pale tones
// earthTexture.ts
export function makeEarthTexture(size: number, seed: number): THREE.CanvasTexture;  // red-brown value noise; browser only
```

- The scene is static in this task: stones sit at `tracker.locations()`. Tapping a highlighted hole calls `controller.playHole`. The `animating` phase is ended at once by calling `animationDone`; Task 10 replaces that.
- `Stones.tsx` uses one `InstancedMesh` per pebble geometry, with per-instance colour and rotation from a seeded RNG.
- `HoleMarkers.tsx` shows ownership with both colour and shape: small marker pebbles at each hole's rim on its owner's side (A: three pale pebbles in a triangle, B: three dark pebbles in a line), plus a tint.
- `HoleHitAreas.tsx` places an invisible cylinder over each hole and a soft glow ring on playable holes. Tapping a hole that can't be played gives it a brief gentle shake and does nothing else (§5.2).
- `CountLabels.tsx` uses drei `Html` and only shows when `settings.showCounts`.
- `CameraRig.tsx`:
  - Uses `seatCamera(humanSeat ?? toMove, aspect)`.
  - In friend mode with `fixedCamera` false, turns to face the player to move (an animated tween; it can snap in this task).
  - drei `OrbitControls` with no pan, ±25° of turn, a 35°–65° tilt, and limited zoom.
- Lighting and quality:
  - One warm directional light with a 1024 shadow map; pebbles cast shadows and the earth receives them.
  - A hemisphere fill light.
  - `Canvas dpr={[1, 2]}`, with drei `PerformanceMonitor` dropping the DPR to 1 when the frame rate falls.
- `?fps=1` shows drei `Stats`.

- [ ] **Step 1: Write the failing tests**

```ts
test('holes run counter-clockwise from above', () => {
  expect(holeCenter(0)[0]).toBeLessThan(holeCenter(5)[0]);
  expect(holeCenter(6)[0]).toBeGreaterThan(holeCenter(11)[0]);
  expect(holeCenter(0)[2]).toBeGreaterThan(0); expect(holeCenter(6)[2]).toBeLessThan(0);
});
test('stoneSlot keeps every stone in or above the bowl', () => {
  for (const n of [1, 4, 12, 20, 48]) for (let i = 0; i < n; i++) {
    const [x, y, z] = stoneSlot(3, i), [cx, , cz] = holeCenter(3);
    expect(Math.hypot(x - cx, z - cz)).toBeLessThanOrEqual(HOLE_RADIUS * 0.85);
    expect(y).toBeGreaterThanOrEqual(bowlSurfaceY(Math.hypot(x - cx, z - cz)) + STONE_SIZE * 0.4);
  }
});
test('the first 4 stones in a hole do not overlap', () => { /* pairwise distance of stoneSlot(h,0..3) ≥ STONE_SIZE * 0.9 */ });
test('seat camera frames the board at portrait aspect', () => {
  for (const aspect of [360 / 640, 16 / 9]) for (const p of [0, 1] as const) {
    const cam = toThreeCamera(seatCamera(p, aspect), aspect);   // PerspectiveCamera looking at target
    for (const corner of boardCorners()) { const v = new THREE.Vector3(...corner).project(cam);
      expect(Math.abs(v.x)).toBeLessThanOrEqual(0.95); expect(Math.abs(v.y)).toBeLessThanOrEqual(0.95); }
  }
});
test('replaying a turn leaves the tracker matching the rules', () => {
  // for seeds 1..50: random match positions; tracker = new StoneTracker(before); events.forEach(e => tracker.apply(e));
  // expect(tracker.holeCounts()).toEqual(after.board); pile counts equal after.captured
});
test('redeal puts 4 stones in every hole', () => { /* after a round-end, tracker.redeal(nextRound); holeCounts all 4; all 48 ids placed exactly once */ });
test('earth bowls are deepest at hole centres', () => { /* sample the vertex nearest each holeCenter: y ≈ −HOLE_DEPTH (±0.03); a vertex 1.5 units outside the board: |y| < 0.03 */ });
test('pebbles vary and stay pebble-sized', () => { /* 6 geometries; each bounding box within 0.6–1.4 × STONE_SIZE; no two have identical position arrays */ });
```

`bowlSurfaceY(d)` and `boardCorners()` are exported from `layout.ts`. `toThreeCamera(seat, aspect)` is a test helper that builds a `THREE.PerspectiveCamera` at `seat.position`, looking at `seat.target`, and calls `updateMatrixWorld()`.

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/web test scene
```

Expected: FAIL, because the modules are missing.

- [ ] **Step 3: Implement the pure modules, then the scene components and `GameScreen`**

`GameScreen` is the `Canvas` with `BoardScene`, plus a temporary corner button that starts a computer-easy quick game, so it can be checked before Task 11.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/web test
```

Expected: all pass.

- [ ] **Step 5: Check it in the browser**

Run `pnpm --filter @etg/web dev`, open the game in the Browser pane, and take screenshots at 1280×800 and 360×640. Check:
- red-brown earth with 12 visible bowls in two rows
- 48 irregular natural-coloured pebbles, 4 per bowl
- ownership markers
- playable holes glowing
- a tap plays a move (stones jump to the new position)
- the whole board is in view at both sizes

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): 3D earth board, pebbles, ownership and tapping"
```

---

### Task 10: Animation and sound

**Files:**
- Create: `apps/web/src/scene/timeline.ts`, `apps/web/src/scene/usePlayback.ts`, `apps/web/src/audio/sfx.ts`
- Modify: `apps/web/src/scene/Stones.tsx`, `BoardScene.tsx`, `HoleMarkers.tsx`
- Test: `apps/web/src/scene/timeline.test.ts`, `apps/web/src/audio/sfx.test.ts`

**Interfaces:**
- Consumes: Task 9 `StoneTracker` and layout; Task 8 `Session.turnEvents`, `turnId`, `Controller.animationDone`.
- Produces:

```ts
// timeline.ts
export const DURATION_MS = {
  normal: { pickup: 300, drop: 220, capture: 400, sweepStone: 60, redealStone: 40 },
  fast:   { pickup: 110, drop: 80,  capture: 150, sweepStone: 25, redealStone: 15 },
  skip:   { pickup: 0,   drop: 0,   capture: 0,   sweepStone: 0,  redealStone: 0 },
} as const;
export interface TimelineStep { event: TurnEvent; atMs: number; durationMs: number }
export function buildTimeline(events: TurnEvent[], speed: Speed): TimelineStep[];   // steps in order, back to back; turn-start and turn-end take 0
export function totalDuration(steps: TimelineStep[]): number;
// usePlayback.ts
export function usePlayback(args: { session: Session; tracker: StoneTracker; speed: Speed; sfx: Sfx; onDone(turnId: number): void }): void;
// sfx.ts — synthesized with Web Audio; no files
export interface Sfx { drop(countAfter: number): void; pickup(count: number): void; capture(): void; setEnabled(on: boolean): void; unlock(): void }
export function createSfx(makeContext?: () => AudioContext | null): Sfx;
```

- **`usePlayback`:**
  - On a new `turnId`, it turns each step into a GSAP tween, moving each stone along an arc from its old position to `tracker.apply(event)`'s target.
  - It plays the matching sound at each drop, pickup and capture.
  - It calls `onDone(turnId)` at the end.
  - With empty `turnEvents` on a new round, it plays `tracker.redeal(...)` and the ownership markers move to their new holes (the change is shown, not just applied).
  - `skip` applies the final positions in one frame and calls `onDone` on the next frame.
  - `session.paused` pauses the GSAP timeline.
- **Sound design:**
  - A drop is a short low thump (a 140–190 Hz sine falling over about 80 ms) plus a burst of band-passed noise, with the pitch varied slightly.
  - A pickup is a soft rattle of small noise ticks.
  - A capture is a slightly fuller thump.
  - `unlock()` resumes the `AudioContext` on the first tap (iOS).
  - Every method is a no-op when sound is disabled or there's no `AudioContext`.

- [ ] **Step 1: Write the failing tests**

```ts
test('opening-move timeline durations', () => {
  const { events } = applyMove(newRound(initialOwners(), 0), 0);   // 5 pickups, 26 drops, no captures
  expect(totalDuration(buildTimeline(events, 'normal'))).toBe(5 * 300 + 26 * 220);
  expect(totalDuration(buildTimeline(events, 'fast'))).toBe(5 * 110 + 26 * 80);
  expect(totalDuration(buildTimeline(events, 'skip'))).toBe(0);
});
test('captures and the round-end sweep are timed', () => {
  const { events } = applyMove(roundFrom([1,0,3,4,0,0, 0,0,0,0,0,0], [20,20], 0), 0);  // sweep of 8 stones
  expect(totalDuration(buildTimeline(events, 'normal'))).toBe(300 + 220 + 8 * 60);
});
test('steps are back to back and in event order', () => { /* atMs[i+1] === atMs[i] + durationMs[i] */ });
test('sfx never throws without audio, when disabled, or before unlock', () => {
  const none = createSfx(() => null); expect(() => { none.drop(1); none.pickup(3); none.capture(); none.unlock(); }).not.toThrow();
  const off = createSfx(() => fakeAudioContext()); off.setEnabled(false); expect(() => off.drop(1)).not.toThrow();
});
```

`fakeAudioContext()` is a minimal stub with `createOscillator`, `createGain`, `createBuffer`, `createBufferSource`, `createBiquadFilter`, `destination`, `currentTime`, `resume`, `state`.

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/web test timeline sfx
```

Expected: FAIL, because the modules are missing.

- [ ] **Step 3: Implement `timeline.ts`, `sfx.ts` and `usePlayback.ts`, and switch the scene to use them**

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/web test
```

Expected: all pass.

- [ ] **Step 5: Check it in the browser**

Play several moves at normal speed in the Browser pane. Check:
- stones lift, arc one by one into the next bowls, relay visibly, and captured fours move to the player's pile in groups of four
- each drop makes a soft earthy sound
- fast and skip work
- a sweep at round end flows to the right pile

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): sowing animation and synthesized stone sounds"
```

---

### Task 11: Game screens — format choice, coin toss, HUD, menu, round summary, result, hole buttons

**Files:**
- Create: `apps/web/src/ui/FormatPicker.tsx`, `CoinToss.tsx`, `Hud.tsx`, `GameMenu.tsx`, `RoundSummary.tsx`, `HoleButtons.tsx`
- Create: `apps/web/src/screens/ResultScreen.tsx`
- Modify: `apps/web/src/screens/HomeScreen.tsx`, `GameScreen.tsx`, `App.tsx`
- Test: `apps/web/src/ui/ui.test.tsx` (React Testing Library)

**Interfaces:**
- Consumes: Task 8 `Controller`, `useSession`; Task 7 store and settings; rules `homesOf`, `MAX_ROUNDS`.
- Behaviour:
  - **Home:**
    - "Play against the computer" asks for the level (easy, medium, hard), then the format.
    - "Play with a friend" asks for the format.
    - "Learn to play" starts guided mode (Task 12).
    - If `loadSession()` returns a session, a "Continue your game" button appears first and calls `controller.resume`.
  - **`FormatPicker`:** "Quick game: one round, most stones wins" or "Full match: up to 5 rounds for homes (ቤት)".
  - **`CoinToss`:** the player calls አንበሳ (lion) or ሰው (person); a coin flips (CSS 3D, about 1.2 s; instant at skip speed); then it shows who starts.
  - **`Hud`:**
    - whose turn it is ("Your turn", "The computer is thinking…", "Player 1" / "Player 2" in friend mode)
    - in a full match, "Round n of 5", or "Extra round" when `roundNumber > 5`
    - each player's stones taken this round
    - each player's homes (`homesOf`)
  - **`GameMenu`:**
    - Opening it calls `controller.setPaused(true)`.
    - Items: restart, speed (normal / fast / skip), counts on/off, fixed camera (friend mode only), sound on/off, quit to home.
  - **`RoundSummary`:** both totals, the homes each player will own next round, and a "Next round" button that calls `continueAfterSummary`.
  - **`ResultScreen`:** the winner, or a draw in a quick game; the score; rounds played in a full match; "Play again" (same mode and format) and "Home".
  - **`HoleButtons`:** visually hidden but keyboard-focusable buttons, one per hole.
    - `data-testid="hole-{i}"`
    - a translated `aria-label` with the hole number, stone count and owner
    - `disabled` unless `playHole` would accept it
    - each one calls `controller.playHole(i)`
  - The query `?speed=skip` forces skip speed, and `?seed=N` makes the controller's RNG and the worker's seeds deterministic. Both exist only for the end-to-end tests; neither changes saved settings.

- [ ] **Step 1: Write the failing tests**

```ts
test('HUD shows the round out of 5 and extra rounds', () => { /* render Hud for roundNumber 2 → 'Round 2 of 5'; roundNumber 6 → 'Extra round' (en) */ });
test('HUD shows homes from ownership', () => { /* owners with 7 for A → A homes 7, B homes 5 */ });
test('round summary shows totals and next homes', () => { /* history last [28,20] → '28', '20', homes 7 and 5 */ });
test('result shows a quick-game draw', () => { /* result winner null reason quick → draw text */ });
test('hole buttons are enabled only for playable holes', () => { /* awaiting-move, A to move, legal [1,5] → hole-1, hole-5 enabled; others disabled; while animating all disabled */ });
test('opening the menu pauses the session', () => { /* click menu → controller.setPaused(true) called */ });
```

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/web test ui
```

Expected: FAIL, because the components are missing.

- [ ] **Step 3: Implement the components and wire the screens**

Remove Task 9's temporary corner button. Add every new string to both `en.json` and `am.json`.

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/web test
```

Expected: all pass, including the i18n key-parity test.

- [ ] **Step 5: Check it in the browser**

In the Browser pane, play a quick game against easy to the result, then a full match through at least one round summary. Check that "Continue your game" appears after a reload mid-game and resumes correctly.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): game flow screens, HUD, menu and accessible hole buttons"
```

---

### Task 12: The guided first game (§5.4)

**Files:**
- Create: `apps/web/src/tutorial/lessons.ts`, `apps/web/src/tutorial/GuidedOverlay.tsx`
- Modify: `apps/web/src/screens/GameScreen.tsx`, `apps/web/src/game/controller.ts` (guided mode uses `chooseMove(…, 'easy')` for the opponent and is never saved)
- Test: `apps/web/src/tutorial/lessons.test.ts`

**Interfaces:**
- Produces:

```ts
export type LessonId = 'sow' | 'relay' | 'stop-empty' | 'capture-last' | 'capture-owner' | 'round-end';
export const LESSON_ORDER: readonly LessonId[] = ['sow','relay','stop-empty','capture-last','capture-owner','round-end'];
export function lessonsInEvents(events: readonly TurnEvent[]): Set<LessonId>;
//   sow: any drop; relay: pickup with relay; stop-empty: turn-end 'empty';
//   capture-last: capture rule 'last-stone'; capture-owner: capture rule 'owner' whose `by` differs from the turn-start player; round-end: round-end
export function nextLesson(done: ReadonlySet<LessonId>): LessonId | null;
export function suggestMove(state: RoundState, lesson: LessonId): HoleIndex | null;   // first legal move whose events teach the lesson, else null
```

- **Flow:**
  1. Guided mode starts a quick game from the standard start, with the learner as A moving first. There's no coin toss.
  2. Before each learner move, `GuidedOverlay` shows a one-line hint for `nextLesson`, and the `suggestMove` hole gets an extra pulse. The learner may play any legal hole.
  3. After each animated turn (either side), each newly seen lesson in order shows a short card (illustrated in words, with ቤት used for the fours) and waits for "Got it". The controller stays paused while a card is open.
  4. After the round, the `round-end` card is followed by a homes demonstration card. It uses the real totals ("If this were a full match, you would own N homes next round"), then the result screen appears.
- "Leave lesson" is always visible and quits to home.

- [ ] **Step 1: Write the failing tests**

```ts
test('the opening move teaches sowing, carrying on and stopping', () => {
  const { events } = applyMove(newRound(initialOwners(), 0), 0);
  expect(lessonsInEvents(events)).toEqual(new Set(['sow', 'relay', 'stop-empty']));
});
test('an owner capture during someone else\'s sowing is recognised', () => {
  const { events } = applyMove(roundFrom([0,0,0,0,3,1, 3,0,0,0,1,0], [20,20], 0), 4);
  expect(lessonsInEvents(events).has('capture-owner')).toBe(true);
});
test('a last-stone capture is recognised', () => {
  const { events } = applyMove(roundFrom([0,0,0,0,0,1, 3,0,0,4,0,0], [20,20], 0), 5);
  expect(lessonsInEvents(events).has('capture-last')).toBe(true);
});
test('lessons come in order', () => {
  expect(nextLesson(new Set())).toBe('sow');
  expect(nextLesson(new Set(['sow', 'relay']))).toBe('stop-empty');
  expect(nextLesson(new Set(LESSON_ORDER))).toBeNull();
});
test('suggestMove finds a teaching move or says none', () => {
  const start = newRound(initialOwners(), 0);
  expect(legalMoves(start)).toContain(suggestMove(start, 'relay'));
  expect(suggestMove(roundFrom([0,0,1,0,0,0, 0,0,3,0,0,0], [20,24], 0), 'capture-last')).toBeNull();
});
```

- [ ] **Step 2: Run them to verify they fail**

```bash
pnpm --filter @etg/web test lessons
```

Expected: FAIL, because the module is missing.

- [ ] **Step 3: Implement `lessons.ts`, `GuidedOverlay.tsx`, and guided mode in the controller and game screen**

- [ ] **Step 4: Run them to verify they pass**

```bash
pnpm --filter @etg/web test
```

Expected: all pass.

- [ ] **Step 5: Check it in the browser**

In the Browser pane, play the guided game to the end. Check:
- every one of the six lesson cards appeared in order
- the homes card showed real numbers
- "Leave lesson" works at any point

If `capture-last` or `capture-owner` never came up in three tries, note it for Task 15. The spec leaves the prepared opening to the builder, so a different starting position is allowed.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): guided first game"
```

---

### Task 13: Offline, install and the download budget

**Files:**
- Create: `apps/web/public/icon.svg`, `apps/web/pwa-assets.config.ts`, `apps/web/scripts/check-size.mjs`
- Modify: `apps/web/vite.config.ts`, `apps/web/package.json`

**Interfaces:**
- `vite-plugin-pwa` settings:
  - `registerType: 'autoUpdate'`
  - workbox `globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}']`
  - manifest: `name: 'Gebeta — ገበጣ'`, `short_name: 'Gebeta'`, `display: 'standalone'`, earthy `theme_color` and `background_color`, icons generated from `icon.svg` by `@vite-pwa/assets-generator`
- The icon is a simple drawing of a top view of earth with two rows of bowls.
- `check-size.mjs` sums the gzip size (Node `zlib.gzipSync`) of every file in `dist/` except `.map` files. It prints the biggest files and the total, and exits 1 if the total is over 3,000,000 bytes.
- `package.json` scripts: `build` (`vite build`), `check:size` (`node scripts/check-size.mjs`), `preview` (`vite preview --port 4173`).

- [ ] **Step 1: Run the budget check before the PWA setup, to get a baseline**

```bash
pnpm --filter @etg/web build
pnpm --filter @etg/web check:size
```

Expected: it prints a total. If the total is already over 3,000,000, cut it before going on: trim the Ethiopic font weights or subsets first, then import only the drei helpers in use.

- [ ] **Step 2: Add the PWA plugin, the manifest and the icons**

- [ ] **Step 3: Build and check the budget again**

```bash
pnpm --filter @etg/web build
pnpm --filter @etg/web check:size
```

Expected: exit 0, total at most 3,000,000 bytes. `dist/manifest.webmanifest` and `dist/sw.js` exist.

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(web): offline play, install and download budget check"
```

The offline behaviour itself is tested in Task 14.

---

### Task 14: End-to-end tests

**Files:**
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/play.spec.ts`, `apps/web/e2e/offline.spec.ts`, `apps/web/e2e/layout.spec.ts`
- Modify: `apps/web/package.json` (script `e2e: playwright test`)

**Interfaces:**
- Playwright config:
  - `webServer`: `pnpm build && pnpm preview` on port 4173
  - projects: chromium desktop and Pixel 7 (mobile emulation)
  - test timeout: 180 s
- Tests drive the game only through `HoleButtons` (`data-testid="hole-{i}"`), at `/?speed=skip&seed=42`.

- [ ] **Step 1: Write the tests**

```ts
// play.spec.ts
test('quick game against easy reaches a result', async ({ page }) => {
  // home → computer → easy → quick → call lion → loop: click the first enabled hole-* button until the result screen is visible
  // expect the result heading and a score of the form "N – M" with N + M = 48
});
test('full match against easy reaches a result through round summaries', async ({ page }) => {
  // same, choosing full match; click "Next round" whenever it shows; expect at least one round summary seen, then the result with rounds ≤ 5 or an extra round
});
test('language switch changes the home screen to Amharic', async ({ page }) => { /* click አማርኛ → the heading shows ገበጣ and the play buttons are in Amharic; reload keeps it */ });
test('continue your game after reload', async ({ page }) => { /* start a quick game, make one move, reload → "Continue your game" visible → click → game resumes with the same stone counts in hole aria-labels */ });
// offline.spec.ts
test('works offline after the first visit', async ({ page, context }) => {
  // load /, await navigator.serviceWorker.ready, context.setOffline(true), reload → home renders; start a quick game and make a move
});
// layout.spec.ts
test('the whole board is visible on a 360×640 phone', async ({ page }) => {
  // viewport 360×640; start a game; screenshot; every hole's projected screen position (exposed only when ?speed=skip via window.__gebetaHolePositions()) lies inside the viewport
});
test('no WebGL shows the message, not a crash', async ({ page }) => {
  // addInitScript overriding HTMLCanvasElement.prototype.getContext to return null for 'webgl2'; expect the NoWebGL text
});
```

`window.__gebetaHolePositions()` returns the 12 hole centres projected to CSS pixels. Add it in `BoardScene` only when the `speed=skip` query is present.

- [ ] **Step 2: Install the browsers and run**

```bash
pnpm --filter @etg/web exec playwright install chromium
pnpm --filter @etg/web e2e
```

Expected: all tests pass on both projects. If a game test loops without finishing, the bug is in the app; fix it there and don't raise the timeout.

- [ ] **Step 3: Run the whole suite**

```bash
pnpm test
pnpm typecheck
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web
git commit -m "test(web): end-to-end play, offline, layout and no-WebGL"
```

---

### Task 15: Owner playtest on a real phone

**Files:** none. Record the findings in `docs/superpowers/plans/2026-10-28-gebeta-web-prototype-playtest.md`.

- [ ] **Step 1: Serve on the home network**

```bash
pnpm --filter @etg/web build
pnpm --filter @etg/web preview --host
```

Give the owner the printed network URL. Also give them `?fps=1` for the frame-rate overlay.

- [ ] **Step 2: The owner checks, on their phone and on desktop**

1. A full match against medium feels like the Gebeta they grew up with: the rules, the earth and pebbles, the sound.
2. The Amharic text in every screen reads naturally; they list any wording to change.
3. The frame rate stays at or above 30 on the phone during sowing.
4. Someone who has never played does the guided game, then a quick game against easy, without help.
5. The camera never needs touching, and the ownership markers are clear after holes change hands.
6. If an iPhone is available, steps 1, 3 and 5 also work in Safari, including sound after the first tap. Automated tests only cover Chromium.

- [ ] **Step 3: Record the results and fix what they find**

Write each finding and its fix in the playtest file. Rule changes go back into the spec first.

- [ ] **Step 4: Commit**

```bash
git add docs
git commit -m "docs: owner playtest results"
```

Putting the game on a public URL (Cloudflare Pages) is **not** part of this plan. It needs the owner's go-ahead first (spec §7).
