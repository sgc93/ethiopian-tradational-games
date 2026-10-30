# Teret Interface Implementation Plan (part 2 of 2: interface, screens, feedback, sound)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every screen in the Teret interface language (gold on dark, Cinzel / EB Garamond / Noto Serif Ethiopic), pin the counts to the 3D board, add the in-world game feedback, the 3D coin, ambient sound, the loading, "turn your phone" and no-WebGL screens, and prove it at three landscape sizes.

**Architecture:** The scene from part 1 draws behind a DOM layer (`.ui-layer`) that is scaled by `clamp(0.82, visibleHeight / 390, 1.6)` and switches to a compact layout below 340 px. Screens are React components that render panels from a small kit (`ui/kit/`) and set `useScene.mode`. In-world feedback lives in `scene/feedback/` and reads the same stores the HUD reads, so the two can never disagree.

**Tech Stack:** as part 1, plus `@fontsource/cinzel@^5.3.0`, `@fontsource/eb-garamond@^5.3.0`, `@fontsource/noto-serif-ethiopic@^5.3.0`, `subset-font@^2.9.0` (in `tools/assets`).

**Spec:** `docs/superpowers/specs/2026-10-29-teret-game-scene-design.md` (sections 7 "Game feedback", 9, 10 "Sound", 12) and the pixel reference `docs/design/scene/mockups/screens.html` with its renders in `docs/design/scene/renders/`.

**Depends on part 1** (`2026-10-29-teret-scene-plan.md`): `useScene` (`mode`, `seat`, `bands`, `tier`), `playCamera`, `project`, `holeCenter`, `storeCenter`, `useBoardView.counts`, `Lights`' fire intensity, `Stones`' positions ref.

## Global Constraints

- Tokens, type faces and sizes exactly as spec §9; pixel positions from `screens.html` at the 844 × 390 reference; everything scales by the factor above; minimums: captions 9.5 px, body 12 px, buttons 36 px tall, medallions 34 px.
- Safe area: `env(safe-area-inset-*)` plus 12 px; the scene fills the whole screen behind.
- Amharic is never uppercased or letter-spaced and runs 2 px larger than the Latin size it replaces; all Amharic uses Noto Serif Ethiopic.
- Works down to 300 px tall (compact layout below 340 px); landscape only; a portrait viewport shows "turn your phone" and stops drawing the scene.
- The existing tests' hooks stay: English button names (`Play against the computer`, `Easy`, `Quick game`, `Full match`, `/Lion/`, `Next round`, `Continue your game`, `English`, `አማርኛ`, `ከኮምፒውተር ጋር ይጫወቱ`), `#result-title`, `.result-score` with an en dash, `[data-testid="hole-N"]` with `disabled` and `aria-label`, `data-testid` `homes-P`, `summary-stones-P`, `summary-homes-P`, `window.__gebetaHolePositions`, `role="alert"` with "WebGL 2".
- Anti-goals: nothing over a cup, stone or count while a player chooses; no confetti, no bouncing; one main button per screen; no religious imagery.
- Budget: fonts ≤ 220 KB gzip after subsetting; `check:size` under 3 MB.
- New strings need `en.json` and `am.json`; the Amharic is marked `// REVIEW` in a `docs/i18n-review.md` list for the owner.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **Visible height changes while playing** (browser toolbars show or hide, keyboard): the scale, bands and camera fit follow `visualViewport.resize` → test in Task 2.
2. **Amharic strings longer than their Latin box** (plate names, buttons): no overflow — ellipsis on names, wrapping in buttons' sub-lines → test in Task 6.
3. **Full-screen request refused** (iPhone Safari, a desktop that denies it): the tap still starts the game → test in Task 3.
4. **Returning from portrait mid-animation:** the game resumes where it was; the scene draws again → test in Task 3.
5. **Count discs during a camera move** (toss → play): never drawn at stale positions; hidden until the move ends → test in Task 6.

---

### Task 1: Fonts and design tokens

**Files:**
- Create: `tools/assets/fonts.mjs`, `apps/web/public/fonts/cinzel-600.woff2`, `cinzel-700.woff2`, `eb-garamond-400.woff2`, `eb-garamond-400i.woff2`, `eb-garamond-500.woff2`, `noto-serif-ethiopic-600.woff2`, `noto-serif-ethiopic-700.woff2`, `apps/web/src/ui/tokens.css`, `apps/web/src/ui/fonts.css`
- Modify: `apps/web/src/main.tsx` (drop the `@fontsource/noto-sans-ethiopic` imports; import `./ui/fonts.css`, `./ui/tokens.css`), `apps/web/package.json` (remove `@fontsource/noto-sans-ethiopic`), `tools/assets/package.json` (add the three fontsource packages and `subset-font` as devDependencies, script `"fonts": "node fonts.mjs"`), `apps/web/src/styles.css` (`:root` font-family → `var(--f-text)`; `[lang="am"], :lang(am)` → `var(--f-geez)`)
- Test: `tools/assets/fonts.test.mjs`, `apps/web/src/ui/tokens.test.ts`

**Interfaces:**
- `fonts.mjs`: `charset(): string` — every character in `apps/web/src/i18n/en.json` and `am.json`, plus `0-9`, `A-Z a-z`, `– — · … ’ “ ” ፡ ። ፣ ? ! ( ) : , . / %`; `subsetAll(): Promise<void>` writes the seven files from the fontsource TTF/woff2 sources (`node_modules/@fontsource/<name>/files/<name>-ethiopic|latin-<weight>-<style>.woff2`), using `subset-font` with `targetFormat: 'woff2'`.
- `tokens.css` declares on `:root` every token of spec §9 as `--ink-950 … --line-soft`, `--f-display: 'Cinzel', serif`, `--f-text: 'EB Garamond', Georgia, serif`, `--f-geez: 'Noto Serif Ethiopic', serif`, `--ui: 1` (the scale), `--safe-x`, `--safe-b`.
- `tokens.test.ts`: `import { TOKENS } from './tokens'` — `apps/web/src/ui/tokens.ts` exports the same values as a typed object (`TOKENS.gold400 === '#d6ae6a'`), used by the 3D feedback for its colours.

- [x] **Step 1: Write the failing tests**

```js
// tools/assets/fonts.test.mjs
test('the charset covers every string and the digits', () => { const c = charset(); for (const ch of 'ገበጣ0123456789GEBETA–') assert.ok(c.includes(ch), ch); });
test('subset files exist and are small', async () => { await subsetAll(); const files = readdirSync(OUT).filter((f) => f.endsWith('.woff2')); assert.equal(files.length, 7);
  const total = files.reduce((s, f) => s + statSync(join(OUT, f)).size, 0); assert.ok(total < 230_000, `fonts total ${total}`); });
```

```ts
// tokens.test.ts
test('tokens match the spec', () => { expect(TOKENS.ink950).toBe('#0a0806'); expect(TOKENS.ember400).toBe('#ff9a3c'); expect(TOKENS.moon300).toBe('#b9cfee'); expect(TOKENS.panel).toBe('rgba(13, 10, 7, 0.84)'); });
```

- [x] **Step 2: Run** `pnpm --filter @etg/assets test` and `pnpm --filter @etg/web test tokens` → FAIL.
- [x] **Step 3: Implement**; `fonts.css` has seven `@font-face` rules with `font-display: swap` and `unicode-range` (Ethiopic `U+1200-137F, U+1380-139F, U+2D80-2DDF, U+AB00-AB2F`).
- [x] **Step 4: Run** → PASS; `pnpm --filter @etg/web build`; `check:size` → fonts total reported.
- [x] **Step 5: Commit** — `feat(web): Teret fonts, subset, and the design tokens`.

---

### Task 2: The interface kit and the scale

**Files:**
- Create: `apps/web/src/ui/kit/Panel.tsx`, `Button.tsx`, `Medallion.tsx`, `Icon.tsx`, `icons.ts` (the SVG paths: `menu, sound, soundOff, back, close, pebble, hut, ibex, knot, phone, rotate, chevron`), `Emblem.tsx` (the ibex medallion drawn from `BLUEPRINT.heads.outlines.side`), `Divider.tsx`, `apps/web/src/ui/kit/kit.css`, `apps/web/src/ui/uiMetrics.ts`, `apps/web/src/ui/useUiMetrics.ts`, `apps/web/src/ui/UiLayer.tsx`
- Test: `apps/web/src/ui/uiMetrics.test.ts`, `apps/web/src/ui/kit/kit.test.tsx`

**Interfaces:**
- `uiMetrics.ts`: `export interface UiMetrics { scale: number; compact: boolean; bands: Bands; height: number; width: number }`; `uiMetrics(width: number, height: number): UiMetrics` — `scale = clamp(0.82, height / 390, 1.6)`, `compact = height < 340`, `bands` in CSS px at this height: full `{ top: 56·scale, bottom: height − 77·scale }`, compact `{ top: 44·scale, bottom: height − 56·scale }` (the compact bottom band is 44 px plus the 12 px inset).
- `useUiMetrics(): UiMetrics` — listens to `window.visualViewport` `resize` (falls back to `window.resize`), sets `--ui` on `document.documentElement` and `useScene.bands`.
- `UiLayer`: `<div className="ui-layer" data-compact={compact}>` with `--ui`, positioned `fixed`, `inset: 0`, `padding: 12px calc(var(--safe-x) + 12px) calc(var(--safe-b) + 12px)`; every screen renders inside it.
- Kit props: `Panel({ title?, width, height?, x?, y?, center?, children, labelledBy })` (title gets the 150 px divider with a diamond; corners are four `.k` diamonds; min inner line inset 4 px); `Button({ kind: 'primary' | 'secondary' | 'quiet' | 'choice', hint?, autoFocus?, children, ...buttonProps })`; `Medallion({ icon, label, size?: 40 | 30, ...buttonProps })`; `Icon({ name, size? })`.
- States and motion per spec §9 "States" and "Motion" in `kit.css` (`.panel-enter` 220 ms rise 12 px, `.panel-exit` 160 ms; `@media (prefers-reduced-motion: reduce)` fades only).

- [x] **Step 1: Write the failing tests**

```ts
test.each([[844, 390, 1, false, 56, 313], [750, 300, 0.82, true, 36.08, 254.08], [1920, 1080, 1.6, false, 89.6, 956.8]])('uiMetrics %i×%i', (w, h, scale, compact, top, bottom) => {
  const m = uiMetrics(w, h); expect(m.scale).toBeCloseTo(scale, 2); expect(m.compact).toBe(compact); expect(m.bands.top).toBeCloseTo(top, 1); expect(m.bands.bottom).toBeCloseTo(bottom, 1);
});
test('visualViewport resize updates the scale', () => { /* mock window.visualViewport {width, height, addEventListener}; renderHook(useUiMetrics); fire resize with height 300; expect result.current.compact true and documentElement.style.getPropertyValue('--ui') === '0.82' */ });
test('kit renders its roles', () => { render(<Panel title="Pause" labelledBy="t"><Button kind="primary">Continue</Button><Medallion icon="menu" label="Menu" /></Panel>);
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument(); expect(screen.getByText('Pause')).toBeInTheDocument(); });
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** the kit and the metrics; mount `<UiLayer>` in `App.tsx` around the screen switch.
- [x] **Step 4: Run** → PASS; visually check a sample panel at 844 × 390 against `renders/09-paused.jpg`.
- [x] **Step 5: Commit** — `feat(web): interface kit, scale and safe areas`.

---

### Task 3: Landscape only, full screen and the "turn your phone" screen

**Files:**
- Create: `apps/web/src/ui/orientation.ts`, `apps/web/src/screens/TurnPhone.tsx`, `apps/web/src/ui/fullscreen.ts`
- Modify: `apps/web/src/App.tsx` (portrait → `<TurnPhone />` over everything; `useScene.setState({ frameloop: 'never' })`), `apps/web/src/scene/SceneRoot.tsx` (`frameloop={useScene.frameloop}`), `apps/web/vite.config.ts` (`orientation: 'landscape'`, `display: 'fullscreen'`), `apps/web/src/game/controller.ts` is **not** modified: pausing uses `controller.setPaused(true)` from `App`
- Test: `apps/web/src/ui/orientation.test.ts`, `apps/web/src/ui/fullscreen.test.ts`, `apps/web/e2e/layout.spec.ts` (portrait test)
- Strings: `turn.title` ("TURN YOUR PHONE" / Amharic), `turn.body`

**Interfaces:**
- `orientation.ts`: `isPortrait(width: number, height: number): boolean` (`height > width`); `usePortrait(): boolean` from `useUiMetrics`.
- `fullscreen.ts`: `requestLandscapeFullscreen(doc = document, screenApi = screen): Promise<boolean>` — calls `documentElement.requestFullscreen()` if present, then `screen.orientation.lock('landscape')` if present; resolves `false` on any rejection, never throws; only on Android (`/Android/.test(navigator.userAgent)`); `onFirstPlayTap()` wired into `HomeScreen`'s Play buttons (Task 5).
- `TurnPhone`: emblem, `Icon name="phone"` rocking 90° every 2 s (CSS keyframes), title and the line in both languages; `role="status"`.
- While portrait: `App` calls `controller.setPaused(true)` once, and `setPaused(false)` when landscape returns only if it was the one that paused (`pausedByOrientation` ref).

- [x] **Step 1: Write the failing tests**

```ts
test('portrait when taller than wide', () => { expect(isPortrait(390, 844)).toBe(true); expect(isPortrait(844, 390)).toBe(false); expect(isPortrait(500, 500)).toBe(false); });
test('full screen refusal resolves false', async () => {
  const doc = { documentElement: { requestFullscreen: () => Promise.reject(new Error('no')) } } as never;
  await expect(requestLandscapeFullscreen(doc, { orientation: { lock: async () => {} } } as never)).resolves.toBe(false);
  await expect(requestLandscapeFullscreen({ documentElement: {} } as never, {} as never)).resolves.toBe(false);
});
```

```ts
// e2e/layout.spec.ts
test('a portrait window shows "turn your phone" and pauses the game', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 }); await openEnglish(page); await startComputerGame(page, 'Quick game'); await waitForTurn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('status')).toContainText(/turn your phone/i);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('status')).toHaveCount(0); await waitForTurn(page); // the game resumes with open holes
});
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement.** Replace `layout.spec`'s 360 × 640 test with 844 × 390 (same assertions on `__gebetaHolePositions`), since portrait no longer shows the board.
- [x] **Step 4: Run** unit tests → PASS; build and e2e → green.
- [x] **Step 5: Commit** — `feat(web): landscape only, with full screen on Android`.

---

### Task 4: Loading screen and the first flare

**Files:**
- Create: `apps/web/src/screens/Loading.tsx`, `apps/web/src/scene/loading.ts`
- Modify: `apps/web/src/App.tsx` (show `Loading` until ready), `apps/web/src/scene/SceneRoot.tsx` (wrap the world in `<Suspense>`; report readiness), `apps/web/src/scene/world/Lights.tsx` and `Flame.tsx` (take `useScene.flare` 0–1 as a multiplier)
- Test: `apps/web/src/scene/loading.test.ts`
- Strings: `loading.line` ("Lighting the fire…" / Amharic)

**Interfaces:**
- `loading.ts`: `loadingState(progress: number, geometryReady: boolean, fontsReady: boolean): number` → 0–1 (`0.7·progress + 0.2·geometry + 0.1·fonts`); `hasVisited(storage): boolean` / `markVisited(storage)` (key `gebeta.visited`, exceptions swallowed); `flareCurve(t: number, duration: number): number` — 0 → 1 with `easeOutCubic`, where `duration` is 2.4 s on a first visit and 0.8 s afterwards.
- `Loading`: emblem, "GEBETA", a 1 px gold line filling to `loadingState`, the line of text; at 1 it fades over 300 ms while `useScene.flare` runs its curve, then `HomeScreen` mounts with the panel-enter motion.

- [x] **Step 1: Write the failing tests**

```ts
test('loading state weights', () => { expect(loadingState(1, true, true)).toBe(1); expect(loadingState(0.5, false, false)).toBeCloseTo(0.35); });
test('flare reaches 1 at its duration and is monotonic', () => { let last = 0; for (let t = 0; t <= 2.4; t += 0.1) { const v = flareCurve(t, 2.4); expect(v).toBeGreaterThanOrEqual(last); last = v; } expect(flareCurve(2.4, 2.4)).toBeCloseTo(1); expect(flareCurve(0.8, 0.8)).toBeCloseTo(1); });
test('visited flag survives a throwing storage', () => { const bad = { getItem() { throw 1; }, setItem() { throw 1; } }; expect(hasVisited(bad)).toBe(false); expect(() => markVisited(bad)).not.toThrow(); });
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** with drei's `useProgress` for `progress`, `document.fonts.ready` for fonts, and the board geometry promise from part 1.
- [x] **Step 4: Run** → PASS; e2e → green (the e2e helpers wait for the Play button, which appears after loading).
- [x] **Step 5: Commit** — `feat(web): loading screen and the fire's first flare`.

---

### Task 5: Home, level, game type and About

**Files:**
- Modify: `apps/web/src/screens/HomeScreen.tsx`, `apps/web/src/ui/FormatPicker.tsx` (both pickers become `Panel`s with `Button kind="choice"`), `apps/web/src/screens/AboutScreen.tsx`, `apps/web/src/styles.css` (delete the old home/about/picker rules)
- Test: `apps/web/src/ui/ui.test.tsx` (extend), `e2e/play.spec.ts` unchanged
- Strings: `home.tagline` stays; add `home.continueHint`

**Interfaces:**
- Home layout at the reference size (from `screens.html` frame 2): title block at left 71 / top 84 (ገበጣ 58 px, "GEBETA" Cinzel 17 / 0.22em, the tagline EB Garamond italic 14); menu stack `Panel` at x 505, y 62, width 268 (`Continue` primary when a save exists, else `Play against the computer` primary; then `Play with a friend`, `Learn to play`, and `About` quiet); bottom left: the language segmented control (30 px tall, pill) and the sound `Medallion` at (243, 322). The level and type panels replace the stack in place with a `Medallion icon="back" size={30}` at their top-left.
- `HomeScreen` sets `useScene.mode = 'home'` on mount; its Play buttons call `onFirstPlayTap()` (Task 3) before `controller.start`.
- `AboutScreen`: a reading `Panel` (x 182, y 26, 480 × 322) over the home scene with `Medallion icon="close"`.

- [x] **Step 1: Write the failing tests** (ui.test.tsx)

```tsx
test('home shows the menu stack with one primary button', () => { render(<HomeScreen />); const primary = document.querySelectorAll('.btn-primary'); expect(primary).toHaveLength(1); expect(screen.getByRole('button', { name: 'Play against the computer' })).toBeInTheDocument(); expect(screen.getByRole('heading', { name: 'ገበጣ' })).toBeInTheDocument(); });
test('level panel replaces the stack and goes back', async () => { render(<HomeScreen />); await userEvent.click(screen.getByRole('button', { name: 'Play against the computer' })); expect(screen.getByRole('button', { name: 'Easy' })).toBeInTheDocument(); await userEvent.click(screen.getByRole('button', { name: /back/i })); expect(screen.getByRole('button', { name: 'Play against the computer' })).toBeInTheDocument(); });
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; the language control's Amharic label uses `lang="am"`.
- [x] **Step 4: Run** unit tests and e2e → green; screenshot at 844 × 390 against `renders/02-home.jpg`, `03-home-level.jpg`, `04-home-format.jpg`, `14-about.jpg` → `progress/p2-05-home-*.png`.
- [x] **Step 5: Commit** — `feat(web): home, pickers and about in the Teret interface`.

---

### Task 6: The play HUD and the pinned count discs

**Files:**
- Create: `apps/web/src/ui/hud/PlayerPlate.tsx`, `Cartouche.tsx`, `Caption.tsx`, `CountDiscs.tsx`, `apps/web/src/ui/hud/hud.css`, `apps/web/src/ui/hud/discAnchors.ts`
- Modify: `apps/web/src/ui/Hud.tsx` (composes the parts; keeps `aria-live` turn text and the `homes-P` test ids), `apps/web/src/ui/GameMenu.tsx` (trigger becomes `Medallion icon="menu"` at top right), `apps/web/src/scene/HoleAnchors.tsx` → replaced by `discAnchors.ts` + `CountDiscs` (keep `window.__gebetaHolePositions`), delete `CountLabels.tsx`
- Test: `apps/web/src/ui/hud/discAnchors.test.ts`, `apps/web/src/ui/ui.test.tsx` (extend)
- Strings: `hud.quickGame` ("QUICK GAME"), `hud.endOfRound` ("END OF ROUND {{n}}")

**Interfaces:**
- `discAnchors.ts`: `discAnchor(index: number): Vec3` — cups 0–5 (near row, z > 0): `[cx, 0, cz + 0.6]`; cups 6–11: `[cx, 0, cz − 0.6]`; stores 12 (A) and 13 (B): `[sx, 0, −0.45]` for the seat's far rim, mirrored for seat B (`discAnchor(index, seat)`); `discScreen(pose, size, index, seat): [number, number]` through part 1's `project`. The anchors reproduce `docs/design/scene/tools/boardview.mjs`' list at 844 × 390 for seat 0.
- `CountDiscs`: 14 discs (24 px, stores 30 px; compact 20 / 26), `data-hole-label={i}` on the first 12, values from `useBoardView.counts` (extend the store to 14 entries: stores = `round.captured`), `playable` discs get the ember ring; on a value change the disc scales to 1.15 and back over 160 ms with a gold flash (`.tick` class toggled via a key change). Positioned every frame from the live camera (`useFrame` in a tiny child of `SceneRoot` writes `transform` directly, as `HoleAnchors` did); `hidden` while `useScene.cameraMoving` is true.
- `PlayerPlate({ player, name, stones, homes?, active, side: 'near' | 'far' })` at (59, 12) far and (59, 313) near; compact 164 × 38. `Cartouche({ text, pips?: { total, done, now } })` at x 338, y 12, 168 × 32 (compact 150 × 28, with the caption as its second line). `Caption({ tone: 'ember' | 'moon', text, thinking })` at y 52.
- `Hud` reads `useScene.seat` to decide which player is "near".

- [x] **Step 1: Write the failing tests**

```ts
test('disc anchors match the mockup at 844×390', () => {
  const pose = playCamera(0, S, { top: 56, bottom: 313 }); const expected = [[306.6, 247.7], [352.7, 247.7], [398.9, 247.7], [445.1, 247.7], [491.3, 247.7], [537.4, 247.7], [527, 169.6], [485, 169.6], [443, 169.6], [401, 169.6], [359, 169.6], [317, 169.6], [584, 192.1], [260, 192.1]];
  expected.forEach(([x, y], i) => { const [px, py] = discScreen(pose, S, i, 0); expect(px).toBeCloseTo(x, 0); expect(py).toBeCloseTo(y, 0); });
});
test('seat B mirrors the anchors', () => expect(discAnchor(0, 1)[2]).toBeCloseTo(-discAnchor(0, 0)[2]));
```

```tsx
test('long Amharic names do not overflow the plate', () => { render(<PlayerPlate player={0} name="ተጫዋች አንድ እና ሁለት" stones={12} active side="near" />); expect(screen.getByText(/ተጫዋች/).className).toContain('nm'); /* .nm has text-overflow: ellipsis; assert computed style via getComputedStyle(...).textOverflow === 'ellipsis' */ });
test('discs hide while the camera moves', () => { useScene.setState({ cameraMoving: true }); render(<CountDiscs />); expect(document.querySelector('.discs')).toHaveAttribute('hidden'); });
test('the cartouche reads QUICK GAME for a quick game', () => { render(<Hud session={quickSession} />); expect(screen.getByText('QUICK GAME')).toBeInTheDocument(); });
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; `useScene.cameraMoving` is set by part 1's `CameraRig` during gsap transitions (add the field there).
- [x] **Step 4: Run** → PASS; e2e → green (the `layout.spec` 844 × 390 positions still come from `__gebetaHolePositions`); screenshots against `renders/07-play-your-turn.jpg` and `08-play-computer.jpg` → `progress/p2-06-play-*.png`; also at 750 × 300 for the compact layout.
- [x] **Step 5: Commit** — `feat(web): play HUD with plates, cartouche, caption and pinned count discs`.

---

### Task 7: Feedback in the world

**Files:**
- Create: `apps/web/src/scene/feedback/CupRings.tsx`, `Inlays.tsx`, `Dust.tsx`, `Sparks.tsx`, `StoreGlow.tsx`, `EyeGlint.tsx`, `pulses.ts`, `apps/web/src/scene/feedback/feedbackStore.ts`
- Modify: `apps/web/src/scene/HoleHitAreas.tsx` (hit cylinders only; rings move to `CupRings`), delete `apps/web/src/scene/HoleMarkers.tsx` (replaced by `Inlays`), `apps/web/src/scene/usePlayback.ts` (emit `feedback` events: `landed(hole)`, `captured(hole, by)`, `turnChanged(player)`; capture flights go to `storeSlot` with height 0.5 over 0.6 s), `apps/web/src/scene/world/Lights.tsx` (turn swell), `apps/web/src/scene/CameraRig.tsx` (3% nudge on capture)
- Test: `apps/web/src/scene/feedback/pulses.test.ts`, `feedbackStore.test.ts`

**Interfaces:**
- `pulses.ts`: `ringPulse(t: number, period = 1.6): number` → 0.4–1.0 (`0.7 + 0.3·sin(2πt/period)`); `suggestedPulse(t)` = `ringPulse(t, 1.0)` scaled to 0.6–1.0; `pressScale = 0.96`; `turnSwell(age: number): number` → `1 + 0.10·sin(π·clamp(age/0.8))` for age ∈ [0, 0.8], else 1; `nudge(age: number): number` → `0.03·sin(π·clamp(age/0.5))`.
- `feedbackStore.ts`: zustand `{ events: FeedbackEvent[]; push(e): void; prune(now): void }` with `type FeedbackEvent = { kind: 'landed'; hole: HoleIndex; at: number } | { kind: 'captured'; hole: HoleIndex; by: Player; at: number } | { kind: 'turn'; player: Player; at: number } | { kind: 'hover'; hole: HoleIndex | null } | { kind: 'press'; hole: HoleIndex | null }`; events older than 3 s are pruned.
- `CupRings`: a `RingGeometry(HOLE_RADIUS + 0.01, HOLE_RADIUS + 0.06)` per playable cup at y 0.012, `#ff9a3c`, opacity from `ringPulse`; hover ×1.3 brightness; press scale `pressScale`. `Inlays`: rims for all 12 cups, gold `#d6ae6a` for A, silver-blue `#b9cfee` for B, opacity 0.25 during play and 0.9 at the end of a round, drawn in sequence 0–11 at 0.6 s each when `mode === 'round-end'`. `Dust`: 6–10 motes per `landed`, 0.4 s, rising 0.3. `Sparks`: ~20 gold points per `captured`, rising 1.2 over 0.8 s. `StoreGlow`: emissive ring on the owner's store, 0.6 s. `EyeGlint`: a 0.08 sprite at the owning head's eye (head-local (1.05, 1.85, ±0.32)), 0.4 s. Capture flight: the four stones fly together in one 0.6 s arc.

- [x] **Step 1: Write the failing tests**

```ts
test('ring pulse stays within 0.4–1.0 with a 1.6 s period', () => { for (let t = 0; t < 4; t += 0.01) { const v = ringPulse(t); expect(v).toBeGreaterThanOrEqual(0.4); expect(v).toBeLessThanOrEqual(1); } expect(ringPulse(0)).toBeCloseTo(ringPulse(1.6)); });
test('turn swell peaks near 10% and ends at 1', () => { expect(turnSwell(0.4)).toBeCloseTo(1.1, 2); expect(turnSwell(0.8)).toBeCloseTo(1); expect(turnSwell(2)).toBe(1); });
test('feedback store prunes', () => { const s = useFeedback.getState(); s.push({ kind: 'landed', hole: 3, at: 0 }); s.push({ kind: 'landed', hole: 4, at: 5 }); s.prune(5); expect(useFeedback.getState().events).toHaveLength(1); });
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; `usePlayback` pushes `landed` at each drop's `at + dur·0.9` (where it already calls `sfx.drop`), `captured` at each capture's `at`, `turn` when the shown turn's player changes.
- [x] **Step 4: Run** → PASS; e2e → green; screenshot a capture moment with `?speed=normal` → `progress/p2-07-capture.png`.
- [x] **Step 5: Commit** — `feat(web): cup rings, inlays, dust, sparks and the firelight’s turn swell`.

---

### Task 8: The 3D coin toss

**Files:**
- Create: `apps/web/src/scene/Coin.tsx`, `apps/web/src/scene/coinFaces.ts`, `apps/web/src/scene/coinSpin.ts`
- Modify: `apps/web/src/ui/CoinToss.tsx` (panels only: the call panel at (242, 252) 360 × 92 and the result panel at (262, 226) 320 × 118; the coin itself is in the scene), `apps/web/src/screens/GameScreen.tsx` (`mode = 'toss'` while open)
- Test: `apps/web/src/scene/coinSpin.test.ts`, `coinFaces.test.ts`

**Interfaces:**
- `coinFaces.ts`: `makeCoinFace(word: 'አንበሳ' | 'ሰው', size = 512): { map: THREE.CanvasTexture; normal: THREE.CanvasTexture }` — gold ground, a sun-ray border (24 rays), the word in Noto Serif Ethiopic 700 at 44% of the diameter; the normal map from the canvas luminance so the letters read as raised. Browser-only; the test checks the pure `coinFaceSpec(word)` → `{ rays: 24, fontPx: number, word }`.
- `coinSpin.ts`: `coinSpin(t: number, lands: 'lion' | 'person', duration = 1.2): { y: number; rx: number; ry: number }` — rises on a parabola to 2.0 and lands at y 0.25 between the rows (0, ·, 0); `rx` spins `5·2π` for lion, `5.5·2π` for person (so the chosen face ends up), eased `cubic-bezier(0.2, 0.7, 0.2, 1)` approximated by `1 − (1 − k)³`; `ry` wobbles `0.15·sin(6πk)·(1 − k)`.
- `Coin`: radius 0.9, thickness 0.12, `MeshPhysicalMaterial({ color: '#d6ae6a', metalness: 0.9, roughness: 0.3 })` with the two faces; waits flat at (0, 0.25, 0); visible only in `mode === 'toss'`; spins when `useScene.coin = { lands, startedAt }` is set by `CoinToss`; `sfx.coinWhoosh()` at the start and `sfx.coinRing()` at the landing (Task 12).

- [x] **Step 1: Write the failing tests**

```ts
test('coin lands flat and face-up on the called side', () => { const l = coinSpin(1.2, 'lion'); expect(l.y).toBeCloseTo(0.25); expect((l.rx / (2 * Math.PI)) % 1).toBeCloseTo(0, 3); const p = coinSpin(1.2, 'person'); expect(((p.rx / (2 * Math.PI)) % 1 + 1) % 1).toBeCloseTo(0.5, 3); });
test('coin rises then falls', () => { expect(coinSpin(0.6, 'lion').y).toBeGreaterThan(1.5); expect(coinSpin(0, 'lion').y).toBeCloseTo(0.25); });
test('face spec', () => expect(coinFaceSpec('ሰው')).toEqual({ rays: 24, fontPx: 225, word: 'ሰው' }));
```

- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement**; the old CSS `.coin` rules and keyframes are deleted; `speed === 'skip'` still skips the flip (`CoinToss` calls `onDone` immediately).
- [x] **Step 4: Run** → PASS; e2e → green (`/Lion/` button, `Play` button); screenshots against `renders/05-toss-call.jpg` and `06-toss-result.jpg`.
- [x] **Step 5: Commit** — `feat(web): a real gold coin for the toss`.

---

### Task 9: Pause, end of a round and the result

**Files:**
- Modify: `apps/web/src/ui/GameMenu.tsx` (panel at (232, 28) 380 × 318: Continue primary, toggle rows Speed / Stone counts / Keep the view fixed (two-player only) / Sound, then Start again and Quit to home quiet; sets `mode = 'paused'` while open; the overlay adds `backdrop-filter: blur(6px) brightness(0.6)`), `apps/web/src/ui/RoundSummary.tsx` (a low panel at (122, 262) 600 × 95: each side's stones and next-round homes as rows of small hut icons, Next round primary in the middle; the cartouche reads `hud.endOfRound`; `mode = 'round-end'`), `apps/web/src/screens/ResultScreen.tsx` (panel at (262, 46) 320 × 288 with the emblem, headline, score, reason, rounds; Play again primary and Home; `mode = 'result'`; an ember burst: `useFeedback.push({ kind: 'burst', at })` → `Embers` emits 200 extra embers over 1 s)
- Test: `apps/web/src/ui/ui.test.tsx` (existing tests keep passing; add the hut rows count)

- [ ] **Step 1: Write the failing test**

```tsx
test('round summary shows homes as huts', () => { render(<RoundSummary session={afterRoundOne} onNext={() => {}} />); expect(screen.getByTestId('summary-homes-0')).toHaveTextContent(String(homesA)); expect(document.querySelectorAll('[data-testid="summary-homes-0"] .hut')).toHaveLength(homesA); });
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the three screens with the kit; keep the `data-testid`s and `#result-title`; the result's `.result-score` keeps `{{a}} – {{b}}`.
- [ ] **Step 4: Run** unit tests and e2e → green; screenshots against `renders/09-paused.jpg`, `10-round-end.jpg`, `11-result.jpg`.
- [ ] **Step 5: Commit** — `feat(web): pause, round end and result panels over the living scene`.

---

### Task 10: Learning to play

**Files:**
- Modify: `apps/web/src/tutorial/GuidedOverlay.tsx` (the hint becomes a `Ribbon` at bottom 33 px, key words wrapped in `<b>` through i18n `<1>…</1>` tags with `Trans`; lesson cards use `Panel` at (222, 96) 400 × 180; "Leave lesson" is a `Medallion icon="close"` in the menu medallion's place), `apps/web/src/ui/kit/Ribbon.tsx` (new), `apps/web/src/i18n/en.json` and `am.json` (hints gain `<1>` markup around the key words)
- Test: `apps/web/src/ui/ui.test.tsx` (ribbon renders the bold key word), `src/i18n/i18n.test.ts` (every `guide.hint.*` in both languages has matching `<1>` tags)

- [ ] **Step 1: Write the failing tests**

```ts
test('every hint marks a key phrase in both languages', () => { for (const lang of ['en', 'am']) for (const [k, v] of Object.entries(resources[lang].guide.hint)) expect(v, `${lang} ${k}`).toMatch(/<1>.+<\/1>/); });
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; the suggested cup's faster pulse already comes from Task 7 (`suggestedPulse`).
- [ ] **Step 4: Run** → PASS; screenshots against `renders/12-guided-hint.jpg`, `13-guided-card.jpg`.
- [ ] **Step 5: Commit** — `feat(web): lesson ribbon and cards`.

---

### Task 11: No-WebGL still and the new strings' review list

**Files:**
- Create: `apps/web/public/home-still.webp` (a 1280 × 720 screenshot of the finished home scene, made with Playwright at `?still=1` which freezes the home camera at t = 12 s and hides the interface, processed by `tools/assets` to ≤ 60 KB), `docs/i18n-review.md`
- Modify: `apps/web/src/screens/NoWebGL.tsx` (the message panel over the still; `role="alert"` kept), `apps/web/src/urlOptions.ts` (`still?: boolean`)

- [ ] **Step 1: Write the failing test** (e2e `layout.spec` no-WebGL test: add `await expect(page.locator('img[src*="home-still"]')).toBeVisible()`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; `docs/i18n-review.md` lists every string added in part 2 with its Amharic, for the owner, together with the prototype's outstanding Amharic review.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(web): the no-WebGL still and the Amharic review list`.

---

### Task 12: Sound

**Files:**
- Modify: `apps/web/src/audio/sfx.ts` (add `ambience(on: boolean)`, `coinWhoosh()`, `coinRing()`, `tick()`, `duck(on: boolean)`), `apps/web/src/audio/sfx.test.ts`, `apps/web/src/screens/GameScreen.tsx` and `HomeScreen.tsx` (ambience on while the scene shows, off on `about`? no: on everywhere after the first gesture), `apps/web/src/ui/kit/Button.tsx` and `Medallion.tsx` (`tick()` on click), `apps/web/src/scene/usePlayback.ts` (`duck(true)` while a timeline plays, `duck(false)` on finish)
- Create: `apps/web/src/audio/ambience.ts`

**Interfaces:**
- `ambience.ts`: `createAmbience(ctx: AudioContext, out: GainNode): { start(): void; stop(): void; duck(on: boolean): void }` — fire crackle: band-passed noise (800–3000 Hz) with random 30–80 ms bursts every 90–400 ms at −18 dB; wind: low-passed noise (200 Hz) swelling on a 9 s LFO at −26 dB; crickets: 4.2 kHz sine chirps in groups of 3 every 2–6 s at −30 dB; `duck` lowers the ambience bus by 6 dB over 150 ms.
- `Sfx` additions: `coinWhoosh()` (filtered noise sweep 0.4 s), `coinRing()` (three detuned sines 2.1/3.3/5.6 kHz, 0.9 s decay), `tick()` (a 1.2 kHz 25 ms wooden tick); all honour `setEnabled`.

- [ ] **Step 1: Write the failing tests**

```ts
test('new sounds exist and respect enabled', () => { const sfx = createSfx(fakeContextFactory); sfx.setEnabled(false); sfx.tick(); sfx.coinRing(); expect(fakeCtx.started).toBe(0); sfx.setEnabled(true); sfx.tick(); expect(fakeCtx.started).toBeGreaterThan(0); });
test('ambience ducks by 6 dB', () => { const a = createAmbience(fakeCtx, fakeCtx.createGain()); a.start(); a.duck(true); expect(a.busGain()).toBeCloseTo(0.5, 1); });
```

(Follow the fake-context pattern already in `sfx.test.ts`.)

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; listen in the in-app browser once with sound on.
- [ ] **Step 5: Commit** — `feat(web): fireside ambience, coin and button sounds`.

---

### Task 13: Acceptance at three sizes

**Files:**
- Modify: `apps/web/playwright.config.ts` (projects: `phone-full` 844 × 390, `phone-compact` 750 × 300, `desktop` 1280 × 720, all `channel: 'chrome'`; the Pixel 7 project is removed), `apps/web/e2e/layout.spec.ts` (screenshots of home, play and result per project into `test-results/screens/<project>-<screen>.png`; assert every count disc lies inside the viewport and outside both bands)
- Create: `docs/design/scene/progress/README.md` section "Part 2", with the three sizes' screenshots beside the renders and the `check:size` total

- [ ] **Step 1: Write the failing test**

```ts
test('count discs sit between the interface bands', async ({ page }, info) => {
  await openEnglish(page); await startComputerGame(page, 'Quick game'); await waitForTurn(page);
  const boxes = await page.locator('.disc').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  const h = page.viewportSize()!.height; const compact = h < 340; const top = compact ? 44 : 56, bottom = h - (compact ? 56 : 77);
  expect(boxes).toHaveLength(14); for (const b of boxes) { expect(b.top).toBeGreaterThanOrEqual(top * 0.82 - 1); expect(b.bottom).toBeLessThanOrEqual(bottom + 1); }
  await page.screenshot({ path: `test-results/screens/${info.project.name}-play.png` });
});
```

- [ ] **Step 2: Run** → FAIL (no `.disc` at the old sizes until the projects change).
- [ ] **Step 3: Implement** the config and the test; run `pnpm test && pnpm typecheck && pnpm --filter @etg/web build && pnpm --filter @etg/web check:size && pnpm --filter @etg/web e2e`.
- [ ] **Step 4: All green**; copy the screenshots into `docs/design/scene/progress/` and write the README section; list the owner's acceptance items from spec §12 with their status (phone fps: pending the owner's phone).
- [ ] **Step 5: Commit** — `test(web): end-to-end at 844×390, 750×300 and 1280×720`.

---

## Self-review notes

- Spec coverage: §9 tokens/type → 1; scale/safe/compact/full screen → 2, 3; parts → 2, 6, 10; screens 1–12 → 4, 5, 6, 8, 9, 10, 3, 11; §7 feedback → 7 (+ 6 for disc ticks); coin → 8; §10 sound → 12; §12 tests → 13; new strings → 3, 4, 6, 11.
- Names shared with part 1: `useScene` fields added here: `frameloop`, `flare`, `cameraMoving`, `coin`; `Bands` from `poses.ts`; `project`, `playCamera`; `useBoardView.counts` grows to 14 entries (Task 6) — part 1's `BoardScene`/`usePlayback` `onCounts` must then include the two store counts (`round.captured`).
- Anti-goal check: nothing sits over a cup during a turn — the ribbon is above the near plate (bottom 33 px), the caption at y 52 is in the top band, and discs are outside the rows.
