# Teret Scene Implementation Plan (part 1 of 2: board, world, camera, tiers)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype's clay board with the blueprint's carved ibex board inside a life-size firelit night set, with the planned camera, lights, effects and performance tiers, while every existing test keeps passing.

**Architecture:** One persistent `<Canvas>` (`SceneRoot`) draws the world behind every screen; a small zustand store (`useScene`) says which camera mode is active. The board, heads and horns are built in code from the blueprint JSON (in a worker, with a main-thread fallback); textures are generated once, processed by a sharp script in `tools/assets/`, and shipped as WebP. Part 2 (`2026-10-29-teret-interface-plan.md`) builds the interface and the in-game feedback on top of this.

**Tech Stack:** React 19, TypeScript strict, Vite 8, three 0.186, @react-three/fiber 9, @react-three/drei 10, @react-three/postprocessing 3 + postprocessing, gsap 3, zustand 5, sharp (dev, in `tools/assets`), vitest 5, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-29-teret-game-scene-design.md` (sections 5–8, 10, 11 and the board blueprint `docs/design/board/blueprint/`).

## Global Constraints

- Units: 1 p = 50 mm; +x towards A's store, +y up, +z towards player A; board top at y = 0; ground at **y = −1.8**.
- First load ≤ 3 MB gzip (`pnpm --filter @etg/web check:size` must pass); textures drop 1024 → 768 before anything else is cut.
- ≥ 30 fps on the owner's Android phone; tiers high / mid / low / minimal; step down below 28 fps, up above 55.
- Offline: every new asset in `public/` must match the workbox glob (add `webp` and `json` to `globPatterns`).
- No 3D decoder larger than 10 KB; no CSG library; no religious imagery; no people.
- "Reduce motion" (`deviceEnv().reducedMotion`): no camera breathing, no orbit, moves become 200 ms cross-fades.
- Unchanged: `@etg/gebeta-rules`, `game/controller.ts`, `game/session.ts`, `scene/playbackPlan.ts`, `scene/stoneTracker.ts`, persistence.
- Keep the prototype's accessibility: hidden `HoleButtons`, `window.__gebetaHolePositions` (used by `e2e/layout.spec.ts`), turn announcements.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- All generated-image prompts end with "no text, no people, no crosses, no religious symbols". The Freepik MCP (`mcp__freepik__generate_image`, Mystic, realism) may be unreachable; then the texture is made in code (Task 10) and the manifest says so.

## Review Focus

1. **Worker unavailable or failing** (old WebView, CSP, a thrown error in the build): the board must still appear, built on the main thread → test in Task 6.
2. **Portrait or extreme aspect** (0.5 and 3.0): `playCamera` returns a finite pose and the fit points stay inside the margins → test in Task 7.
3. **Hidden tab during tier measurement** (`document.hidden`, rAF throttled to 0–1 fps): the tier never drops because of a hidden tab → test in Task 13.
4. **`localStorage` throwing** (private mode, quota): tier read/write never throws → test in Task 13.
5. **Fewer than 48 stones positioned** (first frame before playback runs): `Stones` draws nothing for missing ids, no NaN matrices → test in Task 4.

---

### Task 1: The blueprint inside the app

**Files:**
- Create: `apps/web/src/scene/board/board-dimensions.json` (a copy of `docs/design/board/blueprint/board-dimensions.json`)
- Create: `apps/web/src/scene/board/blueprint.ts`
- Test: `apps/web/src/scene/board/blueprint.test.ts`
- Modify: `apps/web/tsconfig.json` (add `"resolveJsonModule": true` if missing)

**Interfaces:**
- Produces: `export const BLUEPRINT: Blueprint` and `export type Blueprint` (typed shape of the JSON: `body`, `cups`, `stores`, `feet`, `heads` (with `outlines.side|sideHeadOnly|frontHeadOnly|topHeadOnly: [number, number][]`, `horn.stations`, `horn.ridges.list`), `band`, `stones`, `gameLayoutChanges`). Also `export const MM_PER_UNIT = 50`.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs';
import { BLUEPRINT } from './blueprint';

test('the app copy of the blueprint equals the docs copy', () => {
  const docs = JSON.parse(readFileSync(new URL('../../../../../docs/design/board/blueprint/board-dimensions.json', import.meta.url), 'utf8'));
  expect(BLUEPRINT).toEqual(docs);
});
test('key dimensions', () => {
  expect(BLUEPRINT.body.halfLength).toBe(6.05);
  expect(BLUEPRINT.cups.diameter).toBe(0.88);
  expect(BLUEPRINT.heads.measures.hornSpread).toBe(2.27);
  expect(BLUEPRINT.heads.horn.stations).toHaveLength(41);
  expect(BLUEPRINT.heads.horn.ridges.list).toHaveLength(24);
});
```

- [ ] **Step 2: Run it** — `pnpm --filter @etg/web test blueprint` → FAIL (module not found).
- [ ] **Step 3: Copy the JSON and write `blueprint.ts`** (`import data from './board-dimensions.json'; export const BLUEPRINT = data as Blueprint;` with the type declared by hand, not inferred).
- [ ] **Step 4: Run it** → PASS. Run `pnpm --filter @etg/web typecheck` → clean.
- [ ] **Step 5: Commit** — `feat(web): blueprint dimensions in the app`.

---

### Task 2: Game layout on the blueprint board

**Files:**
- Modify: `apps/web/src/scene/layout.ts`
- Modify: `apps/web/src/scene/usePlayback.ts:locationToPosition` (pile → store)
- Modify: `apps/web/src/scene/layout.test.ts`

**Interfaces:**
- Produces (all in `layout.ts`): `HOLE_RADIUS = 0.44`, `HOLE_DEPTH = 0.36`, `STONE_SIZE = 0.2`, `STORE_X = 3.75`, `STORE_RADIUS = 0.7`, `STORE_DEPTH = 0.45`, `GROUND_Y = -1.8`; `holeCenter` unchanged; `storeCenter(player: Player): Vec3` (A's store at +x); `storeSlot(player: Player, index: number): Vec3` (replaces `pileSlot`, which is deleted); `stoneSlot`, `handSlot` retuned; `bowlSurfaceY(d, radius = HOLE_RADIUS, depth = HOLE_DEPTH)`; `fitPoints(): Vec3[]` (replaces `boardCorners`): body corners at x ±6.05, z ±1.28, y 0 and −1.8, plus every side-outline point of both heads at z ∈ {−1, 0, 1} × (hornSpread/2 if v > 1.2 else 0.3), as in `docs/design/scene/tools/frame.mjs`.
- `seatCamera` stays for now (Task 7 replaces it).

- [ ] **Step 1: Write the failing tests** (replace the `pileSlot` tests)

```ts
test('blueprint sizes', () => { expect(HOLE_RADIUS).toBe(0.44); expect(HOLE_DEPTH).toBe(0.36); expect(STONE_SIZE).toBe(0.2); });
test('stones heap inside a cup', () => {
  for (let slot = 0; slot < 20; slot++) {
    const [x, y, z] = stoneSlot(3, slot); const [cx, , cz] = holeCenter(3);
    expect(Math.hypot(x - cx, z - cz)).toBeLessThan(HOLE_RADIUS - STONE_SIZE * 0.35);
    expect(y).toBeGreaterThan(-HOLE_DEPTH); expect(y).toBeLessThan(0.45);
  }
});
test('captured stones go into the owner’s store', () => {
  for (let i = 0; i < 24; i++) {
    const [x, y, z] = storeSlot(0, i);
    expect(Math.hypot(x - STORE_X, z)).toBeLessThan(STORE_RADIUS - STONE_SIZE * 0.35);
    expect(y).toBeGreaterThan(-STORE_DEPTH); expect(y).toBeLessThan(0.5);
    expect(storeSlot(1, i)[0]).toBeCloseTo(-x);
  }
});
test('fit points cover the horns', () => {
  const pts = fitPoints();
  expect(Math.max(...pts.map((p) => Math.abs(p[2])))).toBeCloseTo(1.135, 2);
  expect(Math.max(...pts.map((p) => p[1]))).toBeGreaterThan(3.1);
});
```

- [ ] **Step 2: Run** `pnpm --filter @etg/web test layout` → FAIL.
- [ ] **Step 3: Implement.** Heaps: `PER_LAYER` stays 7, `RING_RADIUS = 0.16`, layer height `STONE_SIZE * 0.6`, stone y = `bowlSurfaceY(d) + STONE_SIZE * 0.45 + layer * STONE_SIZE * 0.6`. Store slots: same ring logic with `PER_LAYER = 9`, `RING_RADIUS = 0.3`, two rings (`k < 9`: ring at 0.3; else ring at 0.15 shifted), using `bowlSurfaceY(d, STORE_RADIUS, STORE_DEPTH)`. `handSlot` y = 0.7. `locationToPosition`: `pile → storeSlot(player, index)`.
- [ ] **Step 4: Run all web tests** `pnpm --filter @etg/web test` → PASS (fix `usePlayback`/`Earth` call sites of renamed symbols; `Earth` keeps working at the new radius until Task 5 removes it).
- [ ] **Step 5: Commit** — `feat(web): game layout on the blueprint cups and stores`.

---

### Task 3: Board body geometry (no CSG)

**Files:**
- Create: `apps/web/src/scene/board/bodyGeometry.ts`
- Test: `apps/web/src/scene/board/bodyGeometry.test.ts`

**Interfaces:**
- Produces: `buildBoardBody(bp: Blueprint, detail: 'full' | 'half' = 'full'): THREE.BufferGeometry` with three `geometry.groups`: 0 = wood (top face and feet), 1 = sides (wood with the carved band's normal map), 2 = cup and store bowls (darker, smoother material). Positions in board units, origin at the top-face centre. Has `position`, `normal`, `uv`, `index`.
- Also `stadiumShape(bp, inset = 0): THREE.Shape` and `capProfile(radius, depth, sphereRadius, segments): [number, number][]` (r, y) points for the lathe, exported for tests.

- [ ] **Step 1: Write the failing tests**

```ts
test('bounding box matches the blueprint', () => {
  const g = buildBoardBody(BLUEPRINT); g.computeBoundingBox(); const b = g.boundingBox!;
  expect(b.max.x).toBeCloseTo(6.05, 2); expect(b.min.x).toBeCloseTo(-6.05, 2);
  expect(b.max.z).toBeCloseTo(1.28, 2); expect(b.max.y).toBeCloseTo(0, 2);
  expect(b.min.y).toBeCloseTo(-1.8, 2); // feet reach the ground
});
test('every cup bottom is at its blueprint depth', () => {
  const g = buildBoardBody(BLUEPRINT); const pos = g.getAttribute('position');
  for (const c of BLUEPRINT.cups.holes) {
    let minY = 0;
    for (let i = 0; i < pos.count; i++) if (Math.hypot(pos.getX(i) - c.x, pos.getZ(i) - c.z) < 0.05) minY = Math.min(minY, pos.getY(i));
    expect(minY).toBeCloseTo(-0.36, 2);
  }
});
test('three material groups and a sane triangle count', () => {
  const g = buildBoardBody(BLUEPRINT);
  expect(g.groups).toHaveLength(3);
  expect(g.index!.count / 3).toBeLessThan(40_000);
  expect(buildBoardBody(BLUEPRINT, 'half').index!.count).toBeLessThan(g.index!.count);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Top face: `ShapeGeometry(stadiumShape(bp, topEdgeRadius))` with 14 `Path` holes at the rim radius (`cups.diameter/2 + cups.rimRadius`). Each bowl: `LatheGeometry(capProfile(...))` from the rim lip (y = +0.0, r = rim) down the sphere cap to the bottom, then translated to the hole. Sides: the stadium perimeter sampled at `band.repeats * 8` points, extruded as a strip with the top rounding (3 steps over `topEdgeRadius`) and bottom rounding (2 steps over `bottomEdgeRadius`), plus a flat bottom `ShapeGeometry` at y = −1.25. Feet: `BoxGeometry` with the 0.06 chamfer approximated by a second, inset box top (two boxes merged) at the four `feet.list` positions, y from −1.25 to −1.8. Merge with `mergeGeometries(..., true)` from `three/examples/jsm/utils/BufferGeometryUtils.js`, then collapse the groups to three (top and feet, sides, bowls). Side UVs: u = arc length / perimeter, v = (y + 1.25) / 1.25, so the band texture (Task 5) wraps 32 times with `repeat.x = 32`. `'half'` halves the lathe and stadium segment counts.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(web): board body geometry from the blueprint`.

---

### Task 4: Stones on the new board

**Files:**
- Modify: `apps/web/src/scene/pebbles.ts` (`PEBBLE_COLOURS` → six tones), `apps/web/src/scene/Stones.tsx`
- Test: `apps/web/src/scene/pebbles.test.ts`, `apps/web/src/scene/Stones.test.tsx` (new)

**Interfaces:**
- Produces: `PEBBLE_COLOURS` = exactly six: `['#a89a86', '#7d6f61', '#c8bba8', '#5b534b', '#9b8468', '#b5aca0']` (sampled from `docs/design/board/images/19-pebbles.jpg`; the builder may re-sample but keeps six). `Stones` keeps its props (`positions: MutableRefObject<Vec3[]>`) and keeps one `InstancedMesh` per pebble shape (six draw calls), sharing a single `MeshStandardMaterial({ roughness: 0.6, metalness: 0 })` with per-instance colour as today, `castShadow` and `receiveShadow` on.

- [ ] **Step 1: Write the failing tests**

```ts
test('six pebble tones', () => expect(PEBBLE_COLOURS).toHaveLength(6));
test('pebbles are about STONE_SIZE across', () => {
  for (const g of makePebbleGeometries(6, 3)) { g.computeBoundingBox(); const s = g.boundingBox!.getSize(new THREE.Vector3());
    expect(s.x).toBeGreaterThan(STONE_SIZE * 0.8); expect(s.x).toBeLessThan(STONE_SIZE * 1.35); }
});
// Stones.test.tsx, with @react-three/test-renderer (add as a devDependency) or by calling the exported pure helper:
test('missing positions leave identity-free, finite matrices', () => {
  const m = stoneMatrices([[0, 0, 0]], 48); // exported helper: builds the 48 matrices, skipping ids without a position
  expect(m.filter(Boolean)).toHaveLength(1); expect(Number.isFinite(m[0]!.elements[12])).toBe(true);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**, extracting `export function stoneMatrices(positions: readonly (Vec3 | undefined)[], count: number): (THREE.Matrix4 | null)[]` used by the `useFrame` loop.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(web): bigger pebbles in six tones`.

---

### Task 5: Band and wood textures through the asset pipeline

**Files:**
- Create: `tools/assets/package.json` (`{ "name": "@etg/assets", "private": true, "type": "module", "scripts": { "build": "node process.mjs", "test": "node --test" }, "devDependencies": { "sharp": "^0.35.5" } }`), `tools/assets/process.mjs`, `tools/assets/textures.json`, `tools/assets/lib.mjs`, `tools/assets/lib.test.mjs`
- Modify: `pnpm-workspace.yaml` (add `tools/*`)
- Create (outputs, committed): `apps/web/public/textures/wood-color.webp`, `wood-normal.webp`, `wood-rough.webp` (1024², 1024², 512²), `band-normal.webp` (512 × 544)
- Create: `docs/design/scene/sources/manifest.json`

**Interfaces:**
- Produces (`lib.mjs`): `makeSeamless(sharpImage, blend = 0.12): Promise<Sharp>` (offset by half, cross-fade the seam band), `heightToNormal(heightBuf: {data, width, height}, strength = 2): Buffer` (RGB, Sobel), `grade(sharpImage, {gamma, tint:[r,g,b], saturation}): Sharp`, `roughnessFromHeight(heightBuf, {base, range}): Buffer` (grey).
- `textures.json` entry shape: `{ "id": "wood", "source": "../../docs/design/board/images/17-wood-texture.jpg", "size": 1024, "seamless": true, "grade": { "gamma": 1.15, "tint": [1, 0.92, 0.8] }, "outputs": ["color", "normal", "rough"], "normalSize": 1024, "roughSize": 512 }`; `band` uses `"source": "../../docs/design/board/blueprint/band-height-tile.svg", "outputs": ["normal"], "size": [512, 544], "seamless": false`.
- `process.mjs [id...]` builds the listed ids (all when none) into `apps/web/public/textures/<id>-<output>.webp` (quality 82, normal maps lossless-ish quality 95).

- [ ] **Step 1: Write the failing tests** (`node --test tools/assets`)

```js
test('seamless output wraps', async () => {
  const img = sharp({ create: { width: 64, height: 64, channels: 3, background: '#808080' } }).composite([{ input: Buffer.from(gradientPng), left: 0, top: 0 }]);
  const { data, info } = await (await makeSeamless(img)).raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++) assert.ok(Math.abs(data[y * info.width * 3] - data[(y * info.width + info.width - 1) * 3]) < 24);
});
test('flat height gives a flat normal', () => {
  const n = heightToNormal({ data: Buffer.alloc(16 * 16, 128), width: 16, height: 16 });
  assert.deepEqual([n[0], n[1], n[2]], [128, 128, 255]);
});
```

- [ ] **Step 2: Run** → FAIL. `pnpm install` after adding the workspace entry.
- [ ] **Step 3: Implement `lib.mjs` and `process.mjs`**; add the `wood` and `band` entries; run `pnpm --filter @etg/assets build`.
- [ ] **Step 4: Run the tests** → PASS. Check the outputs exist and `wood-color.webp` < 250 KB. Write `docs/design/scene/sources/manifest.json` with one entry per texture: `{ id, source, tool: 'owner reference image' | 'freepik mystic' | 'code', prompt?, date, variant?, status: 'accepted' }`.
- [ ] **Step 5: Commit** — `feat(assets): texture pipeline with the wood and band maps`.

---

### Task 6: Ibex head and horn geometry, built in a worker

**Files:**
- Create: `apps/web/src/scene/board/headGeometry.ts`, `apps/web/src/scene/board/hornGeometry.ts`, `apps/web/src/scene/board/board.worker.ts`, `apps/web/src/scene/board/useBoardGeometry.ts`
- Test: `apps/web/src/scene/board/headGeometry.test.ts`, `hornGeometry.test.ts`, `useBoardGeometry.test.ts`

**Interfaces:**
- Produces: `buildHead(bp: Blueprint, budget = 8000): GeometryData`; `buildHorn(bp: Blueprint, side: 1 | -1, budget = 6000): GeometryData`; `type GeometryData = { position: Float32Array; normal: Float32Array; uv: Float32Array; index: Uint32Array }` (transferable); `toBufferGeometry(d: GeometryData): THREE.BufferGeometry`; `placeHead(g: THREE.BufferGeometry, end: 'A' | 'B')` (end B: head at x = −5.25 facing +x, i.e. u → +x; end A: mirrored, u → −x). Head-local axes: u forward, v up, w sideways.
- `useBoardGeometry(detail: 'full' | 'half'): { body, head, hornL, hornR } | null` — asks `board.worker.ts` (message `{ detail }` → `{ body, head, hornL, hornR }` as `GeometryData`, transferred); if `Worker` is undefined or the worker errors or takes > 4 s, builds on the main thread. Results are cached per detail for the session.

- [ ] **Step 1: Write the failing tests**

```ts
test('head fills the blueprint box', () => {
  const g = toBufferGeometry(buildHead(BLUEPRINT)); g.computeBoundingBox(); const b = g.boundingBox!;
  expect(b.max.y).toBeCloseTo(BLUEPRINT.heads.measures.earTipV, 1);      // ears are the top of the head
  expect(b.min.y).toBeCloseTo(0, 1); // the neck foot sits on the top face (v = 0)
  expect(b.max.x - b.min.x).toBeCloseTo(BLUEPRINT.heads.measures.sideLength, 1);
  expect(b.max.z).toBeLessThan(0.6); // half the ear width
  expect(g.index!.count / 3).toBeLessThanOrEqual(8000);
});
test('horns sweep to the blueprint spread and height', () => {
  const g = toBufferGeometry(buildHorn(BLUEPRINT, 1)); g.computeBoundingBox(); const b = g.boundingBox!;
  expect(b.max.z).toBeCloseTo(BLUEPRINT.heads.measures.hornSpread / 2, 1);
  expect(b.max.y).toBeCloseTo(3.2, 1);
  expect(g.index!.count / 3).toBeLessThanOrEqual(6000);
  const pos = g.getAttribute('position'); for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i))).toBe(true);
});
test('ridges raise the outer face', () => {
  const plain = buildHorn({ ...BLUEPRINT, heads: { ...BLUEPRINT.heads, horn: { ...BLUEPRINT.heads.horn, ridges: { count: 0, list: [] } } } }, 1);
  const ridged = buildHorn(BLUEPRINT, 1);
  expect(Math.max(...ridged.position) ).toBeGreaterThan(Math.max(...plain.position));
});
// useBoardGeometry.test.ts (jsdom): with globalThis.Worker undefined the hook resolves on the main thread
test('falls back to the main thread without Worker', async () => {
  const { result } = renderHook(() => useBoardGeometry('half'));
  await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 10_000 });
  expect(result.current!.head.attributes.position.count).toBeGreaterThan(100);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement the head.** Slices: 40 values of v from 0 to `earTipV`; for each v take `[uMin, uMax]` from `outlines.sideHeadOnly`, `wHalf` from `outlines.frontHeadOnly` (w extent at that v), and the top outline `outlines.topHeadOnly` as a polygon in (u, w). Cast 32 rays from the slice centre `((uMin+uMax)/2, 0)` and set each radius to the smallest of: the side rectangle, the ellipse `(u-uc)²/((uMax-uMin)/2)² + w²/wHalf² = 1`, and the top polygon. Connect slices into a grid (40 × 32 = 2,560 quads = 5,120 triangles), cap the neck foot (fan at v = 0) and the ear tip (fan), then two passes of Laplacian smoothing (0.5) that skip the neck cap, `computeVertexNormals`. Below v = `neckFilletRadius` grow the radius by the fillet (quarter-circle blend) so the neck meets the top face. Budget: if `tris > budget`, reduce the slices by the ratio and rebuild.
- [ ] **Step 4: Implement the horn.** For each of the 41 `stations` `{u, v, z, depth, width, normal: [nu, nv]}` build a 16-point oval: `centre + cos(a)·depth/2·normal + sin(a)·width/2·ŵ` where ŵ is the sideways unit vector; `z` is multiplied by `side`. Ridges: for each ridge `{t, height}` push vertices with `|t_station − t| < 0.012` outward along `normal` by `height · (1 − |Δt|/0.012)` on the outer half (`cos(a) > 0`). Cap the tip with a fan. 41 × 16 × 2 = 1,312 triangles; fine for both budgets (the 'half' detail uses every second station).
- [ ] **Step 5: Implement the worker and hook**; the worker imports `bodyGeometry.ts`, `headGeometry.ts`, `hornGeometry.ts` and transfers the buffers; Vite worker import: `new Worker(new URL('./board.worker.ts', import.meta.url), { type: 'module' })` as `ai.worker.ts` does.
- [ ] **Step 6: Run** → PASS (`pnpm --filter @etg/web test board`).
- [ ] **Step 7: Commit** — `feat(web): ibex head and horn geometry from the blueprint`.

---

### Task 7: The board on screen, with the play camera

**Files:**
- Create: `apps/web/src/scene/board/woodMaterial.ts`, `apps/web/src/scene/board/Board.tsx`, `apps/web/src/scene/camera/poses.ts`, `apps/web/src/scene/textures.ts`
- Modify: `apps/web/src/scene/BoardScene.tsx` (replace `Earth` with `Board`; keep lights for now), `apps/web/src/scene/CameraRig.tsx` (use `playCamera`), `apps/web/src/scene/layout.ts` (delete `seatCamera`), `apps/web/src/screens/GameScreen.tsx` (Canvas `camera={{ fov: 30, near: 0.1, far: 2000 }}`, `gl={{ toneMapping: THREE.AgXToneMapping, outputColorSpace: THREE.SRGBColorSpace }}`, `shadows="soft"`)
- Delete: `apps/web/src/scene/Earth.tsx`, `earthGeometry.ts`, `earthTexture.ts` and their tests (ground returns in Task 9)
- Test: `apps/web/src/scene/camera/poses.test.ts`

**Interfaces:**
- Produces (`poses.ts`): `export interface Pose { position: Vec3; target: Vec3; fov: number }`; `export interface Bands { top: number; bottom: number }` (px from the top edge of the top band's bottom and the bottom band's top, e.g. `{ top: 56, bottom: 313 }` at 390 tall); `playCamera(seat: Player, size: { width: number; height: number }, bands: Bands): Pose` — tilt 48°, fov 30, target (0, 0.4, 0), distance searched from 8 to 80 in 0.25 steps until every `fitPoints()` projection lies within x ∈ [0.095·w, 0.905·w] and y ∈ [bands.top + 7, bands.bottom − 13]; seat B mirrors z. `topCamera(size, bands): Pose` (tilt 84°, distance 15.5, target (0, 0, 0.05)). `project(pose, size, point: Vec3): [number, number]` (CSS px) for tests and Part 2's count discs.
- `woodMaterial(tex: BoardTextures): [MeshPhysicalMaterial, MeshPhysicalMaterial, MeshStandardMaterial]` (wood: map, normalMap, roughnessMap, clearcoat 0.25, clearcoatRoughness 0.35, roughness 0.55; sides: the same with the band normal map; bowls: colour darkened 0.8, roughness 0.45, `aoMap` from a 64² radial gradient canvas).
- `textures.ts`: `useBoardTextures(): BoardTextures` via drei `useTexture` with `{ map: '/textures/wood-color.webp', normal, rough, band: '/textures/band-normal.webp' }`; `band.repeat.set(32, 1)`, `wrapS = RepeatWrapping`. The side material slot (group 1) is a clone of the wood material with `normalMap = band`.
- `Board.tsx`: `<Board detail />` renders body (3 materials), two heads and four horns with `placeHead`, `castShadow` and `receiveShadow`, and `null` until `useBoardGeometry` resolves.

- [ ] **Step 1: Write the failing tests**

```ts
test('844×390 play view matches the mockup framing', () => {
  const pose = playCamera(0, { width: 844, height: 390 }, { top: 56, bottom: 313 });
  expect(pose.fov).toBe(30);
  expect(Math.hypot(...sub(pose.position, pose.target))).toBeCloseTo(16.25, 0);
  const xs = fitPoints().map((p) => project(pose, { width: 844, height: 390 }, p));
  expect(Math.min(...xs.map((p) => p[0]))).toBeGreaterThanOrEqual(80); expect(Math.max(...xs.map((p) => p[0]))).toBeLessThanOrEqual(764);
  expect(Math.min(...xs.map((p) => p[1]))).toBeGreaterThanOrEqual(63); expect(Math.max(...xs.map((p) => p[1]))).toBeLessThanOrEqual(300);
});
test('seat B looks from the other side', () => expect(playCamera(1, { width: 844, height: 390 }, { top: 56, bottom: 313 }).position[2]).toBeLessThan(0));
test.each([[0.5, 400, 800], [3, 1800, 600]])('aspect %s keeps the board inside the margins', (_, width, height) => {
  const bands = { top: 56, bottom: height - 77 };
  const pose = playCamera(0, { width, height }, bands);
  for (const p of fitPoints()) { const [x, y] = project(pose, { width, height }, p);
    expect(Number.isFinite(x)).toBe(true); expect(x).toBeGreaterThanOrEqual(width * 0.095 - 1); expect(y).toBeGreaterThanOrEqual(bands.top + 6); }
});
test('compact bands push the camera back', () => {
  const full = playCamera(0, { width: 750, height: 390 }, { top: 56, bottom: 313 });
  const compact = playCamera(0, { width: 750, height: 300 }, { top: 44, bottom: 256 });
  expect(compact.position[1]).toBeGreaterThan(full.position[1]);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `poses.ts`** (a `THREE.PerspectiveCamera` + `Vector3.project`, as the old `seatCamera` did), `woodMaterial.ts`, `textures.ts`, `Board.tsx`; wire `BoardScene` and `CameraRig` (`CameraRig` takes `seat` and `bands` props; `BoardScene` passes `bands={{ top: 56, bottom: size.height - 77 }}` until Part 2 supplies the real bands). `HoleAnchors` needs no change: it projects `holeCenter`, which is unchanged.
- [ ] **Step 4: Run** unit tests → PASS; `pnpm --filter @etg/web build && pnpm --filter @etg/web e2e` → all green (the `layout.spec` 360×640 test still passes because `playCamera` fits any aspect).
- [ ] **Step 5: Look at it:** `pnpm --filter @etg/web dev`, open `/?speed=skip` in the in-app browser at 844×390, screenshot to `docs/design/scene/progress/07-board.png`. The horns must not touch the HUD bands.
- [ ] **Step 6: Commit** — `feat(web): carved board on screen with the planned play camera`.

---

### Task 8: Scene root, scene store and the lights

**Files:**
- Create: `apps/web/src/scene/SceneRoot.tsx`, `apps/web/src/scene/sceneStore.ts`, `apps/web/src/scene/world/Lights.tsx`, `apps/web/src/scene/world/flicker.ts`, `apps/web/src/scene/world/environment.ts`
- Modify: `apps/web/src/App.tsx` (render `<SceneRoot />` once, above the screen switch; screens become overlays), `apps/web/src/screens/GameScreen.tsx` (no `Canvas`; it sets `useScene.setState({ mode: 'play' })` and passes its props to the scene through `sceneStore`), `apps/web/src/screens/HomeScreen.tsx` (sets `mode: 'home'`), `apps/web/src/styles.css` (`.scene-root { position: fixed; inset: 0; z-index: 0 }`, screens `position: relative; z-index: 1`)
- Test: `apps/web/src/scene/world/flicker.test.ts`, `apps/web/src/scene/sceneStore.test.ts`

**Interfaces:**
- `sceneStore.ts`: `export type SceneMode = 'home' | 'play' | 'toss' | 'round-end' | 'result' | 'paused'`; `useScene` zustand store `{ mode: SceneMode; seat: Player; bands: Bands; session: Session | null; speed: Speed; sfx: Sfx | null; suggested: HoleIndex | null; onHoleTap(h): void; onAnimationDone(id): void; setMode(m): void }` with defaults (`mode: 'home'`, `bands: { top: 56, bottom: 313 }`).
- `flicker.ts`: `flicker(t: number): number` = `0.85 + 0.15 · n(t)`, `n` ∈ [0, 1] from sines at 7.3, 11.1, 17.9 Hz (weights 0.5, 0.3, 0.2) multiplied by a 0.6 Hz swell `0.8 + 0.2·sin`; `jitter(t: number, seed: number): Vec3` with each component in ±0.3.
- `Lights.tsx`: the six lights of spec §7 with the starting intensities: fire point 60 (decay 2, distance 120), fire shadow spot 40 (angle 0.6 rad, penumbra 0.6, shadow map from `tier`, camera near 2, far 60, aimed at (0, 0, 0)), warm fill directional 1.4, moon directional 0.35, hut point 8 (distance 40), hemisphere 0.25. `useFrame` applies `flicker(t)` to the fire and spot intensities and `jitter` to the fire position; hut light `0.9 + 0.1·sin(0.7 t)`.
- `environment.ts`: `makeEnvironment(gl: THREE.WebGLRenderer): THREE.Texture` — a `PMREMGenerator` of a 16-face scene: black sphere with a warm (#ff9a3c) emissive disc towards −x and a faint blue (#1b2740) cap above; set as `scene.environment` in `SceneRoot`.
- `SceneRoot.tsx`: the only `<Canvas>` (`gl` as Task 7, `dpr` from the tier later, `far 2000`); children: `<Lights />`, `<Board />`, `<Stones />`, `<HoleMarkers />`, `<HoleHitAreas />`, `<HoleAnchors />`, `<CameraRig />` (reads mode/seat/bands from `useScene`), fog `<fogExp2 attach="fog" args={['#0a0806', 0.0035]} />` (half-faded at 240: e^(−(0.0035·240)²) ≈ 0.49), `<color attach="background" args={['#0a0806']} />`.

- [ ] **Step 1: Write the failing tests**

```ts
test('flicker stays within 0.85–1.0 and averages near 0.93', () => {
  const v = Array.from({ length: 6000 }, (_, i) => flicker(i / 600));
  expect(Math.min(...v)).toBeGreaterThanOrEqual(0.85); expect(Math.max(...v)).toBeLessThanOrEqual(1.0);
  const mean = v.reduce((a, b) => a + b) / v.length; expect(mean).toBeGreaterThan(0.9); expect(mean).toBeLessThan(0.96);
});
test('jitter stays within ±0.3', () => { for (let t = 0; t < 10; t += 0.013) for (const c of jitter(t, 1)) expect(Math.abs(c)).toBeLessThanOrEqual(0.3); });
test('scene store defaults', () => { expect(useScene.getState().mode).toBe('home'); expect(useScene.getState().bands).toEqual({ top: 56, bottom: 313 }); });
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the store, flicker, lights, environment and `SceneRoot`; move the `Canvas` out of `GameScreen` (keep `PerformanceMonitor` and `?fps` `Stats` in `SceneRoot`). `HomeScreen` and `AboutScreen` keep their DOM for now (Part 2 restyles them) but render over the live scene.
- [ ] **Step 4: Run** unit tests → PASS; `pnpm --filter @etg/web e2e` → green (the home screen now has a canvas behind it; `layout.spec` still finds `canvas`).
- [ ] **Step 5: Screenshot** the play view → `docs/design/scene/progress/08-lights.png`: long shadows towards +x, warm top, cool rim on the horns.
- [ ] **Step 6: Commit** — `feat(web): one scene behind every screen, lit by the fire`.

---

### Task 9: Ground, mat and grass

**Files:**
- Create: `apps/web/src/scene/world/Ground.tsx`, `Mat.tsx`, `Grass.tsx`, `apps/web/src/scene/world/grassGeometry.ts`
- Test: `apps/web/src/scene/world/grassGeometry.test.ts`
- Assets: `earth` (from `images/20-ground-under-the-board.jpg`, 1024² colour + 512² normal) and `mat` (generated, 512² colour + 256² normal) entries in `tools/assets/textures.json`; outputs committed; `manifest.json` updated

**Interfaces:**
- `Ground`: `CircleGeometry(600, 64)` at y = −1.8, `receiveShadow`, earth colour + normal, `repeat 60`; scattered decals: 300 instanced small planes (straw, pebbles, leaves drawn into one 128² canvas atlas, alpha-tested) within radius 40, none under the mat.
- `Mat`: `CircleGeometry(1, 64)` scaled (11, 6.5) at y = −1.79 with the mat texture (repeat 6, 4); a fringe ring (`RingGeometry(1, 1.06, 96)`) with a 1-D fringe alpha texture made in code (alphaTest 0.5).
- `grassGeometry.ts`: `buildGrass(count: number, seed: number): THREE.InstancedBufferGeometry` — blades (a 3-segment strip, 0.4–0.9 tall, 0.06 wide) placed at random in an annulus between the mat's edge and radius 20, excluding the hearth disc (centre (−26, −2), r 9); attribute `aOffset` (x, z, yaw, height) and the vertex shader bends them by `sin(time·1.3 + x·0.4 + z·0.6) · 0.18 · t²` (t = height along the blade). `Grass` reads the count from the tier (`high 3000, mid 1500, low/minimal 0`).

- [ ] **Step 1: Write the failing test**

```ts
test('grass avoids the mat and the hearth', () => {
  const g = buildGrass(2000, 3); const a = g.getAttribute('aOffset');
  for (let i = 0; i < a.count; i++) { const x = a.getX(i), z = a.getY(i);
    expect((x / 11) ** 2 + (z / 6.5) ** 2).toBeGreaterThan(1); expect(Math.hypot(x + 26, z + 2)).toBeGreaterThan(9); expect(Math.hypot(x, z)).toBeLessThan(20.01); }
  expect(a.count).toBe(2000);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Generate the mat texture** with the Freepik MCP (prompt from spec §10; square, 1024, then processed to 512) into `docs/design/scene/sources/mat.jpg`; check it tiled 3 × 3 (a quick sharp `tile` into `sources/check/mat-3x3.jpg`); if the MCP is unreachable, make it in code (`tools/assets/procedural.mjs: weave(size)`, two interleaved sinusoidal bands) and mark `tool: 'code'` in the manifest. Add both entries, run the pipeline.
- [ ] **Step 4: Implement** the three components and add them to `SceneRoot`.
- [ ] **Step 5: Run** tests → PASS; build; screenshot → `progress/09-ground.png`.
- [ ] **Step 6: Commit** — `feat(web): packed earth, the woven mat and grass`.

---

### Task 10: The hearth, the flame, embers and smoke

**Files:**
- Create: `apps/web/src/scene/world/Hearth.tsx`, `Flame.tsx`, `flameShader.ts`, `Embers.tsx`, `embersShader.ts`, `Smoke.tsx`, `noise.ts`
- Test: `apps/web/src/scene/world/noise.test.ts`, `Embers.test.ts`
- Assets: `basalt` (generated, 512²) entry; outputs committed; manifest updated

**Interfaces:**
- `noise.ts`: `makeNoiseTexture(size = 256, seed = 1): THREE.DataTexture` (tileable 2-octave value noise, RGBA, RepeatWrapping) using `valueNoise` moved here from the deleted `earthGeometry.ts`.
- `Hearth`: 9 stones (`DodecahedronGeometry(1, 1)` jittered, scaled 3–4, basalt map) on a ring r = 7 around (−26, −1.8, −2); 6 logs (`CylinderGeometry` r 0.6, length 10–14, bark texture from Task 11 or a flat `#2a1a10` until then) crossed over the centre; charred ends emissive `#ff6a1a`; an ember bed: a 6-radius disc with `emissive #ff7a2a`, emissiveIntensity `2.5 · flicker(t)`.
- `Flame`: 3 planes (8–12 tall, 5 wide) crossed at 60° at (−26, −1.8, −2), `ShaderMaterial` (additive, depthWrite false) scrolling the noise texture upwards (two layers at 0.9 and 1.6 speed), shaped by a vertical gradient and `1 − |x|`, coloured from `#ffe9b0` (base) through `#ff9a3c` to `#d9661f` (tip), alpha scaled by `flicker(t)`; plus a `Sprite` glow (radial canvas, #ff9a3c, 24 wide) with opacity `0.35 · flicker(t)`.
- `Embers`: `embersState(count, seed): { origin: Float32Array; life: Float32Array; speed: Float32Array }`; a `Points` with a custom shader: position = origin + (breeze `+x` 0.9/s + rise 8/s · t) with sideways wobble, size 2–4 px (`gl_PointSize` scaled by dpr), colour from `#ffb060` to `#ff5a1a` over life, lifetime 2.5–5 s looping; count from the tier (`160/90/40/24`).
- `Smoke`: N billboards (`high 14 / mid 10 / low 6 / minimal 4`) from a 128² soft radial canvas, rising at 3/s, drifting +x at 1.2/s, growing ×3, opacity 0.18 → 0, recycled at y > 80.

- [ ] **Step 1: Write the failing tests**

```ts
test('noise texture tiles', () => { const t = makeNoiseTexture(64, 1); const d = t.image.data as Uint8Array;
  for (let y = 0; y < 64; y++) expect(Math.abs(d[y * 64 * 4] - d[(y * 64 + 63) * 4])).toBeLessThan(40); });
test('embers live 2.5–5 s and rise to about 40', () => { const s = embersState(100, 1);
  for (let i = 0; i < 100; i++) { expect(s.life[i]).toBeGreaterThanOrEqual(2.5); expect(s.life[i]).toBeLessThanOrEqual(5); expect(s.speed[i] * s.life[i]).toBeGreaterThan(20); expect(s.speed[i] * s.life[i]).toBeLessThan(45); } });
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Generate `basalt`** (Freepik or code: `procedural.mjs: basalt(size)`), process, update the manifest.
- [ ] **Step 4: Implement** and add to `SceneRoot`. The embers and smoke origin is the flame's top.
- [ ] **Step 5: Run** tests → PASS; screenshot the **home** mode (`useScene.setState({ mode: 'home' })` via the dev console, camera still the play pose until Task 12) → `progress/10-fire.png`.
- [ ] **Step 6: Commit** — `feat(web): the hearth, its flame, embers and smoke`.

---

### Task 11: Props, the hut, trees, mountains and sky

**Files:**
- Create: `apps/web/src/scene/world/Props.tsx` (jebena + brazier + cups tray, stool + gabi, basket), `Hut.tsx`, `Trees.tsx`, `Sky.tsx`, `skyShader.ts`, `latheProfiles.ts`
- Test: `apps/web/src/scene/world/latheProfiles.test.ts`
- Assets: `bark` 512², `thatch` 512², `plaster` 512², `ridge` 2048 × 256 (alpha), `trees` 1024 × 512 atlas (alpha) — generated (Freepik or code), processed, committed; manifest updated

**Interfaces:**
- `latheProfiles.ts`: `JEBENA: [number, number][]` (r, y) 5 tall with a neck and spout handle built separately, `CUP`, `BRAZIER`, `BASKET` (6 tall, lidded), `STOOL_LEG`; `export function lathe(profile, segments = 24): THREE.LatheGeometry`.
- `Props`: at the spec §5 positions; glazed clay `MeshPhysicalMaterial({ color: '#2a1a12', roughness: 0.35, clearcoat 0.6 })`; brazier coals emissive pulsing `0.8 + 0.2·sin(2.1t)`; 4 steam sprites above the spout (rise 1.5/s, fade over 1.2 s); gabi: a `BoxGeometry(5, 1.2, 4)` with a cream material and the band normal map on its edge strip.
- `Hut`: `CylinderGeometry(60, 60, 36, 48, 1, true)` plaster + `ConeGeometry(68, 50, 48, 1, true)` thatch at (150, −1.8, 0); doorway: a `PlaneGeometry(18, 30)` emissive `#ffb35c` in the wall facing −x (x = 90), intensity `1.2 · (0.9 + 0.1·sin(0.7t))`.
- `Trees`: 24 billboards (`PlaneGeometry`, 200–400 tall) from the tree atlas (4 silhouettes), `alphaTest 0.5`, placed on a ring 400–800 at seeded angles, never within ±20° of the camera's home arc behind the hut; a vertex-shader sway of ±1.5°.
- `Sky`: `SphereGeometry(2000, 32, 16)` back side; `ShaderMaterial`: vertical gradient `#05070e` → `#0b1226`, 1,500 hashed stars twinkling (`sin(t·f + phase)`), a moon disc (radius 0.04 rad) at direction (8, 20, −14) normalised with a soft halo, two cloud layers from the noise texture scrolling at 1/20 and 1/26 of its width per second across the moon, and the ridge strip blended along the horizon (v ∈ [0.47, 0.56]).

- [ ] **Step 1: Write the failing test**

```ts
test('lathe profiles are closed and sized', () => {
  expect(JEBENA.at(-1)![1]).toBeCloseTo(5, 1); expect(JEBENA[0]![0]).toBe(0);
  expect(BASKET.at(-1)![1]).toBeCloseTo(6, 1); expect(CUP.at(-1)![1]).toBeCloseTo(1, 1);
  const g = lathe(JEBENA); g.computeBoundingBox(); expect(g.boundingBox!.max.y).toBeCloseTo(5, 1);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Generate the five images** (prompts in spec §10; ridge and trees are keyed out with sharp: `removeBackground` is not available, so threshold luminance > 0.8 → alpha 0 with a 2 px feather), process, tile-check the three tileables, update the manifest. Code fallback per image if the MCP is unreachable: `procedural.mjs: bark, thatch, plaster, ridge, trees` (ridge = layered 1-D noise silhouettes; trees = 4 fractal-branch silhouettes drawn with canvas in node via sharp SVG input).
- [ ] **Step 4: Implement** the five components and add them to `SceneRoot`.
- [ ] **Step 5: Run** tests → PASS; build; `check:size` → report the total (expect ≈ 1.6 MB); screenshot home mode → `progress/11-world.png`.
- [ ] **Step 6: Commit** — `feat(web): the fireside props, the hut, trees, mountains and sky`.

---

### Task 12: Camera moves

**Files:**
- Modify: `apps/web/src/scene/camera/poses.ts` (add `homePose(t)`, `orbitPose(t)`, `seatArc(from, to, k)`), `apps/web/src/scene/CameraRig.tsx` (rewrite)
- Test: `apps/web/src/scene/camera/poses.test.ts` (extend)

**Interfaces:**
- `homePose(t: number): Pose` — radius 22 from (0, 0, 0) on A's side, azimuth `25° · sin(2π t / 60)` (eased by the sine itself), height 2–5 above the top (y = `3.5 + 1.5·sin(2π t / 60 + 1)`), target (−9, 0.5, −1) (between the board and the fire), fov 32.
- `orbitPose(t: number): Pose` — radius 18, tilt 35°, azimuth `2π t / 40`, target (0, 0.2, 0), fov 30.
- `seatArc(from: Pose, to: Pose, k: number): Pose` — k ∈ [0, 1]; the position follows a circle around the fire end (centre (−6, 0, 0)) at the seats' radius and rises by `6 · sin(πk)` so the flames show; the target lerps.
- `CameraRig` (no props; reads `useScene`): mode → pose: `play` → `playCamera(seat, size, bands)`; `home` → `homePose(clock)`; `toss` and `round-end` → `topCamera`; `result` → `orbitPose(clock)`; `paused` keeps the last pose. Transitions with gsap: play ↔ toss 1.0 s, play → round-end 1.2 s, seat change 1.4 s along `seatArc`, everything else 0.8 s, `power2.inOut`. Drag in play mode: `OrbitControls` limits azimuth ±15°, polar 38°–58°, distance ×0.9–1.1; on release a 2 s delay then an eased return (gsap 0.8 s). Breathing in play mode: `±0.04` on sines of 7 s and 11 s added to the position. Reduced motion: no breathing, no orbit (the result uses a fixed `orbitPose(0)`), transitions replaced by a 200 ms cross-fade of a full-screen black plane (`useScene.fade` 0 → 1 → 0).

- [ ] **Step 1: Write the failing tests**

```ts
test('home arc stays within ±25° and 2–5 above the top', () => {
  for (let t = 0; t < 60; t += 0.5) { const p = homePose(t); const az = Math.atan2(p.position[0], p.position[2]) * 180 / Math.PI;
    expect(Math.abs(az)).toBeLessThanOrEqual(25.01); expect(p.position[1]).toBeGreaterThanOrEqual(2); expect(p.position[1]).toBeLessThanOrEqual(5);
    expect(Math.hypot(p.position[0], p.position[2])).toBeCloseTo(22, 1); }
});
test('home camera clears every prop by 2', () => {
  const props = [[-32, 10], [-20, 9], [-20, -9], [-15, -11]];
  for (let t = 0; t < 60; t += 0.5) for (const [x, z] of props) expect(Math.hypot(homePose(t).position[0] - x, homePose(t).position[2] - z)).toBeGreaterThan(2);
});
test('orbit: one turn in 40 s at radius 18', () => { expect(orbitPose(40).position).toEqual(orbitPose(0).position); expect(Math.hypot(orbitPose(7).position[0], orbitPose(7).position[2])).toBeCloseTo(18 * Math.cos(35 * Math.PI / 180), 1); });
test('seat arc rises in the middle', () => { const a = playCamera(0, S, B), b = playCamera(1, S, B); expect(seatArc(a, b, 0.5).position[1]).toBeGreaterThan(a.position[1] + 4); expect(seatArc(a, b, 1)).toEqual(b); });
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the poses and the rig. Drive `useScene.mode` from the game: `GameScreen` sets `toss` while `CoinToss` is open, `round-end` during `round-summary`, `result` when `finished`, `paused` while the menu is open, else `play`; `HomeScreen`/`AboutScreen` set `home`.
- [ ] **Step 4: Run** tests → PASS; e2e → green; record a 10 s screen capture of home → play → toss in the in-app browser if possible, else three screenshots → `progress/12-camera-*.png`.
- [ ] **Step 5: Commit** — `feat(web): choreographed camera for home, play, toss, round end and result`.

---

### Task 13: Performance tiers

**Files:**
- Create: `apps/web/src/scene/tiers.ts`, `apps/web/src/scene/useTier.ts`
- Modify: `apps/web/src/scene/SceneRoot.tsx` (dpr, shadow map size, counts from the tier), every tier-dependent component (`Grass`, `Embers`, `Smoke`, `Lights`, `Board` detail)
- Test: `apps/web/src/scene/tiers.test.ts`

**Interfaces:**
- `tiers.ts`: `export type Tier = 'high' | 'mid' | 'low' | 'minimal'`; `export const TIERS: Record<Tier, { dpr: number; shadowMap: number; bakedShadow: boolean; post: 'full' | 'full-no-dof' | 'light' | 'none'; grass: number; embers: number; smoke: number; detail: 'full' | 'half'; drawCalls: number }>` with spec §11's table (high dpr 2 → use `Math.min(2, devicePixelRatio)`, mid 1.5, low 1, minimal 0.85); `nextTier(current: Tier, medianFps: number): Tier` (below 28 → one step down, above 55 → one step up, else same; clamped); `median(samples: number[]): number`; `readStoredTier(storage: Pick<Storage, 'getItem'> | null): Tier | null` and `storeTier(storage, tier)` — both swallow exceptions; key `gebeta.tier`.
- `useTier.ts`: `useTier(): Tier` — starts from the stored tier or `mid`; during the first 3 s of `mode === 'home'` collects frame deltas with `useFrame` and, when `document.visibilityState === 'visible'` and ≥ 60 samples were collected, applies `nextTier` and measures again (at most 3 rounds); stores the result. Exposes `useScene.tier`. Keeps drei's `PerformanceMonitor` (`onDecline` → one step down, never up) during play.

- [ ] **Step 1: Write the failing tests**

```ts
test.each([['mid', 20, 'low'], ['mid', 40, 'mid'], ['mid', 60, 'high'], ['high', 60, 'high'], ['minimal', 10, 'minimal']])('nextTier(%s, %i) = %s', (c, f, e) => expect(nextTier(c as Tier, f)).toBe(e));
test('median ignores order', () => expect(median([50, 10, 30])).toBe(30));
test('storage that throws is ignored', () => {
  const bad = { getItem() { throw new Error('private'); }, setItem() { throw new Error('private'); } };
  expect(readStoredTier(bad)).toBeNull(); expect(() => storeTier(bad, 'low')).not.toThrow(); expect(readStoredTier(null)).toBeNull();
});
test('the table has the spec counts', () => { expect(TIERS.high.grass).toBe(3000); expect(TIERS.low.embers).toBe(40); expect(TIERS.minimal.post).toBe('none'); expect(TIERS.minimal.bakedShadow).toBe(true); });
// useTier: hidden document never steps down
test('hidden tab does not change the tier', () => { expect(decide('mid', [0, 0, 0], 'hidden')).toBe('mid'); expect(decide('mid', Array(60).fill(1000 / 20), 'visible')).toBe('low'); });
```

(`decide(current, deltasMs, visibility): Tier` is the pure core of `useTier`, exported from `tiers.ts`.)

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**; the minimal tier's baked shadow: a 256² radial-blurred stadium silhouette drawn with canvas, placed as a transparent plane on the mat offset (+1.4, −0.3) (as `boardview.mjs` draws it), shown instead of the shadow spot light.
- [ ] **Step 4: Run** → PASS; e2e → green; `?tier=low` URL override (read in `urlOptions.ts`: `tier?: Tier`) for testing on the phone.
- [ ] **Step 5: Commit** — `feat(web): performance tiers measured on the home screen`.

---

### Task 14: Post-processing

**Files:**
- Modify: `apps/web/package.json` (add `@react-three/postprocessing@^3.2.2` and `postprocessing@^6.39.5`; sharp in Task 5 is `^0.35.5`)
- Create: `apps/web/src/scene/Post.tsx`, `apps/web/src/scene/gradeEffect.ts`
- Test: `apps/web/src/scene/gradeEffect.test.ts`

**Interfaces:**
- `gradeEffect.ts`: `export class GradeEffect extends Effect` (from `postprocessing`) with the fragment: lift shadows towards teal (`mix(color, color + vec3(-0.02, 0.01, 0.03), 1.0 - luma)`) and push highlights towards amber (`mix(color, color * vec3(1.06, 1.0, 0.92), luma)`), uniform `strength` (0–1, default 1); `export const GRADE_SHADOW = [-0.02, 0.01, 0.03]`, `GRADE_HIGHLIGHT = [1.06, 1.0, 0.92]`.
- `Post.tsx`: by tier — `full`: `EffectComposer` with `SMAA`, `Bloom({ luminanceThreshold: 0.85, intensity: 0.6, mipmapBlur: true })`, `DepthOfField({ focusDistance: <board>, focalLength: 0.02, bokehScale: 2 })`, `Noise(0.06)`, `Vignette({ offset: 0.35, darkness: 0.65 })`, `GradeEffect`; `full-no-dof`: the same without DoF and SMAA; `light`: bloom at `resolutionScale 0.5`, noise, vignette, grade; `none`: no composer, and `Lights`/materials get the grade through `scene.environment` tint and a `toneMappingExposure` of 1.05.

- [ ] **Step 1: Write the failing test**

```ts
test('the grade effect compiles its fragment with both constants', () => {
  const e = new GradeEffect(); expect(e.fragmentShader).toContain('-0.02'); expect(e.fragmentShader).toContain('1.06'); expect(e.uniforms.get('strength')!.value).toBe(1);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Install and implement**; mount `<Post />` in `SceneRoot` after the world.
- [ ] **Step 4: Run** → PASS; `check:size` → still under 3 MB (report the number); e2e → green; screenshots of play on `high` and `minimal` → `progress/14-post-*.png`.
- [ ] **Step 5: Commit** — `feat(web): bloom, grain, vignette and the colour grade by tier`.

---

### Task 15: Part 1 acceptance

**Files:**
- Modify: `apps/web/vite.config.ts` (`globPatterns` gains `webp` and `json`), `apps/web/e2e/layout.spec.ts` (add 844 × 390 and 750 × 300 screenshots of the play view)
- Create: `docs/design/scene/progress/README.md` (the screenshots with one line each)

- [ ] **Step 1: Run everything:** `pnpm test && pnpm typecheck && pnpm --filter @etg/web build && pnpm --filter @etg/web check:size && pnpm --filter @etg/web e2e` → all green; paste the `check:size` total into the README.
- [ ] **Step 2: Phone check:** open the dev server on the owner's Android phone (`?fps`), note the fps per tier in the README (the owner does this if the phone isn't at hand; leave the row as "pending").
- [ ] **Step 3: Compare** `progress/14-post-high.png` with `docs/design/scene/renders/07-play-your-turn.jpg` and the key art; list differences worth fixing in the README under "Before part 2".
- [ ] **Step 4: Commit** — `docs(scene): part 1 progress and acceptance`.

---

## Self-review notes

- Spec coverage: §5 world → Tasks 9–11; §6 board → 1–7; §7 lights → 8, motion → 9–11, feedback → part 2, post → 14; §8 camera → 7, 12; §10 assets → 5, 9–11; §11 tiers → 13; §12 acceptance → 15 and part 2. The stones' store slots (§6) → Task 2 and 4. Ownership inlays, cup rings, captures, sound, interface → part 2.
- Names used across tasks: `Blueprint`/`BLUEPRINT` (1); `fitPoints`, `storeSlot`, `GROUND_Y` (2); `buildBoardBody` (3, 6); `GeometryData`, `toBufferGeometry`, `useBoardGeometry`, `placeHead` (6, 7); `Pose`, `Bands`, `playCamera`, `topCamera`, `project` (7, 12, part 2); `useScene`, `SceneMode` (8, 12, 13, part 2); `flicker`, `jitter` (8, 10); `Tier`, `TIERS`, `useTier` (13, 9–11, 14).
