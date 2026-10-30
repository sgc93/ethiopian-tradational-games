# Teret scene: build progress

Screenshots taken from the running game as each part of the scene plan landed, for the owner to set beside the mockup renders in `../renders/` and the key art in `../mockups/teret-key-art.jpg`.

## Part 1: board, world, camera, tiers

| Shot | What it shows |
|---|---|
| [07-board.jpg](07-board.jpg) | The blueprint board built in code (body, cups, stores, feet, ibex heads and horns) under the planned play camera, before the lights were redone. Flat and too red: the prototype's lights. |
| [08-lights.jpg](08-lights.jpg) | The fire's lights: long shadows thrown towards the hut end, the warm fill on the top, the cool rim on the horns. |
| [09-ground.jpg](09-ground.jpg) | Packed earth, the woven mat and grass, with the lights and the earth grade toned down by eye. |
| [10-fire.jpg](10-fire.jpg) | The hearth from the fireside look (`?cam=home`): flames, embers, logs and the stone ring. |
| [11-world.jpg](11-world.jpg) | The whole set from the fireside look: sky, moon glow, trees, the mountain ridge, the coffee corner, the stool, the basket and the board. |
| [14-post-high-home.jpg](14-post-high-home.jpg) | The home screen on the high tier with post-processing: bloom, vignette, grain and the teal-and-amber grade (portrait pane; the interface is part 2's). |

**Download budget:** 1,605.6 KB gzip with post-processing, of the 2,929.7 KB budget (`pnpm --filter @etg/web check:size`).

**Phone frame rate:** pending the owner's Android phone (open the dev server with `?fps`; `?tier=low` and `?tier=minimal` fix a tier).

## Before part 2

Differences from the renders and the key art worth fixing, seen so far:

1. The wood still reads redder and brighter than the key art's wanza; the wood texture's grade and the fire's colour temperature want one more pass by eye once the interface is on.
2. The grass blades are tall quills; the key art shows shorter, denser tufts at the mat's edge.
3. The jebena sits in the home camera's line of sight to the fire; the home target or the coffee corner may want a small shift.
4. All seven generated textures are code-made fallbacks (the Freepik connector was unreachable); regenerate them from the spec's prompts when it is back (`docs/design/scene/sources/manifest.json` lists them).

## Part 2: the Teret interface

Every screen rebuilt in the Teret language over the living scene, captured from the running game (headless Chrome's software renderer, so the lighting is flatter than on a real GPU; the layout is what to judge). The renders to set them beside are in `../renders/`.

### The three sizes (spec §12)

The end-to-end suite now runs every test at 844 × 390 (a full-height phone), 750 × 300 (a phone browser with its toolbars: the compact layout) and 1280 × 720 (a desktop window), and shoots home, play and the result at each.

| Size | Home | Play | Result |
|---|---|---|---|
| 844 × 390 | [p2-13-phone-full-home.jpg](p2-13-phone-full-home.jpg) | [p2-13-phone-full-play.jpg](p2-13-phone-full-play.jpg) | [p2-13-phone-full-result.jpg](p2-13-phone-full-result.jpg) |
| 750 × 300 | [p2-13-phone-compact-home.jpg](p2-13-phone-compact-home.jpg) | [p2-13-phone-compact-play.jpg](p2-13-phone-compact-play.jpg) | [p2-13-phone-compact-result.jpg](p2-13-phone-compact-result.jpg) |
| 1280 × 720 | [p2-13-desktop-home.jpg](p2-13-desktop-home.jpg) | [p2-13-desktop-play.jpg](p2-13-desktop-play.jpg) | [p2-13-desktop-result.jpg](p2-13-desktop-result.jpg) |

### Every screen at the reference size

| Render | Capture |
|---|---|
| 01 loading | the loading screen is captured in the session notes; it matches `01-loading.jpg` (emblem, GEBETA, the gold line, "Lighting the fire…") |
| 02 home | [p2-05-home-menu-844x390.png](p2-05-home-menu-844x390.png) · Amharic: [p2-05-home-menu-am-844x390.png](p2-05-home-menu-am-844x390.png) |
| 03 home · level | [p2-05-home-level-844x390.png](p2-05-home-level-844x390.png) |
| 04 home · game type | [p2-05-home-format-844x390.png](p2-05-home-format-844x390.png) · Amharic: [p2-05-home-format-am-844x390.png](p2-05-home-format-am-844x390.png) |
| 05 toss · call | [p2-08-toss-call-844x390.png](p2-08-toss-call-844x390.png) |
| 06 toss · result | [p2-08-toss-result-844x390.png](p2-08-toss-result-844x390.png) (mid-flight: [p2-08-toss-flight-844x390.png](p2-08-toss-flight-844x390.png)) |
| 07 play · your turn | [p2-06-play-your-turn-844x390.png](p2-06-play-your-turn-844x390.png) · compact: [p2-06-play-your-turn-750x300.png](p2-06-play-your-turn-750x300.png) |
| 08 play · the computer sows | [p2-06-play-after-move-844x390.png](p2-06-play-after-move-844x390.png) (easy plays too fast to catch mid-sow; a capture moment: [p2-07-capture.png](p2-07-capture.png)) |
| 09 paused | [p2-09-paused-844x390.png](p2-09-paused-844x390.png) |
| 10 end of a round | [p2-09-round-end-844x390.png](p2-09-round-end-844x390.png) |
| 11 result | [p2-09-result-844x390.png](p2-09-result-844x390.png) |
| 12 lesson · hint and card | [p2-10-lesson-hint-844x390.png](p2-10-lesson-hint-844x390.png) · [p2-10-lesson-card-844x390.png](p2-10-lesson-card-844x390.png) |
| 13 about | [p2-05-home-about-844x390.png](p2-05-home-about-844x390.png) · Amharic: [p2-05-home-about-am-844x390.png](p2-05-home-about-am-844x390.png) |
| 14 turn your phone | shot by the e2e portrait test into `apps/web/test-results/turn-phone-390x844.png` |
| 15 no WebGL | [p2-11-nowebgl-844x390.png](p2-11-nowebgl-844x390.png) |

**Download budget:** 1,290.5 KB gzip of the 2,929.7 KB budget (`pnpm --filter @etg/web check:size`); the fonts are 83 KB of that and the no-WebGL still 52 KB.

### The owner's acceptance (spec §12)

| Item | Status |
|---|---|
| Layout: every screen at 844 × 390 beside the renders | captured above; positions follow `screens.html` to the pixel at the reference size, scaled by the interface elsewhere. **For the owner to judge.** |
| Layout at 1920 × 1080 | the suite's largest size is 1280 × 720 (the plan's three); 1920 × 1080 scales the same way (×1.6, the cap). **Pending a desktop look by the owner.** |
| Look: play and home against the key art | the captures here are from a software renderer; part 1's notes on the wood's grade and the grass still stand. **For the owner on a real GPU.** |
| Speed: 30 fps on the owner's Android phone, 60 on a desktop | **pending the owner's phone** (`?fps` shows the counter; `?tier=low` / `?tier=minimal` fix a tier). |
| Size: `check:size` under 3 MB | 1,290.5 KB. **Done.** |
| Tests: cup centres and disc anchors, tier rules | `layout.test.ts`, `discAnchors.test.ts` (against the design tool's list), `tiers.test.ts`. **Done.** |
| Tests: e2e at the three landscape sizes | `phone-full`, `phone-compact`, `desktop` projects. **Done.** |
| Tests: a portrait viewport shows "turn your phone" | `layout.spec.ts`. **Done.** |
| Every existing test still passes | unit and e2e green at every task. **Done.** |

### Still open after part 2

1. The Amharic added in part 2 waits for the owner's reading: `docs/i18n-review.md`.
2. Ownership is shown by inlay colour alone (gold / silver-blue) now that the prototype's pebble markers are gone; the hole buttons' labels still name the owner. Worth a look with a colour-blind eye.
3. The sound mix was checked by instrumentation, not by ear: the balance of crackle, breeze, crickets, ticks and the coin wants one real listen.
4. The "computer sows" moment (render 08) is not captured mid-sow; easy plays too quickly for a screenshot.
