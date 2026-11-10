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

The end-to-end suite now runs every test at 844 × 390 (a full-height phone), 750 × 300 (a phone browser with its toolbars: the compact layout), 1280 × 720 (a desktop window) and 1920 × 1080 (the spec's large desktop, at the interface's ×1.6 cap), and shoots home, play and the result at each.

| Size | Home | Play | Result |
|---|---|---|---|
| 844 × 390 | [p2-13-phone-full-home.jpg](p2-13-phone-full-home.jpg) | [p2-13-phone-full-play.jpg](p2-13-phone-full-play.jpg) | [p2-13-phone-full-result.jpg](p2-13-phone-full-result.jpg) |
| 750 × 300 | [p2-13-phone-compact-home.jpg](p2-13-phone-compact-home.jpg) | [p2-13-phone-compact-play.jpg](p2-13-phone-compact-play.jpg) | [p2-13-phone-compact-result.jpg](p2-13-phone-compact-result.jpg) |
| 1280 × 720 | [p2-13-desktop-home.jpg](p2-13-desktop-home.jpg) | [p2-13-desktop-play.jpg](p2-13-desktop-play.jpg) | [p2-13-desktop-result.jpg](p2-13-desktop-result.jpg) |
| 1920 × 1080 | [p2-13-desktop-large-home.jpg](p2-13-desktop-large-home.jpg) | [p2-13-desktop-large-play.jpg](p2-13-desktop-large-play.jpg) | [p2-13-desktop-large-result.jpg](p2-13-desktop-large-result.jpg) |

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
| Layout at 1920 × 1080 | captured above by the `desktop-large` project; the interface sits at its ×1.6 cap and the camera fit is the same rule. **For the owner to judge.** |
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

## Part 3: the Walia heads reworked

The owner asked for the heads to look like the carved references (`docs/design/board/images/07-side.jpg`, `08-front.jpg`, `11-three-quarter.jpg`, `12-one-horn.jpg`). A first pass sculpted them from hand-placed ellipsoids; the owner judged it still not good, and the second pass rebuilt them from the references themselves:

- **The head** is the blueprint's traced side outline (`outlines.sideHeadOnly`, ear taken out) inflated sideways, the way a carver roughs a profile out of a block (`apps/web/src/scene/board/sculpt/sdf.ts`). Its width by height and the muzzle's taper are measured on the front photograph (image 08, 273 px a unit); the edges round fully on the neck and more crisply at the face. On it are cut the almond eyes with their lids, the brow, cheekbones, the jaw, the mouth line, the nostrils and the beard's locks; the ears are leaves of their own, cupped forward and out.
- **The horns** are tubes swept along the blueprint's 41 stations (`sculpt/horn.ts`), with the 24 ridges as bold knuckles on the front face. Their roots are carried down into the skull until buried, which ends the first pass's fault of a horn root running down over the face.
- **The meshes** are marching cubes trimmed by meshoptimizer's quadric simplifier (bundled with three) and shaded with the field's own normals, packed with them (`IBX2`) into `apps/web/public/models/ibex-head-{full,half}.bin` (282 KB and 134 KB) by `apps/web/scripts/build-heads.ts`. Budgets: 12,000 triangles a head and 6,000 a horn on the full tier (the spec said 8,000 a head; raised for the eyes and lids), half on the low tier.

Studio comparison, each reference beside the model under neutral light: [p3-heads-studio.jpg](p3-heads-studio.jpg).

| Before | Side | Three-quarter | Front |
|---|---|---|---|
| [p3-heads-before.jpg](p3-heads-before.jpg) | [p3-heads-side.jpg](p3-heads-side.jpg) | [p3-heads-three-quarter.jpg](p3-heads-three-quarter.jpg) | [p3-heads-front.jpg](p3-heads-front.jpg) |

In the game: [p3-heads-home-1920x1080.jpg](p3-heads-home-1920x1080.jpg) · [p3-heads-play-1920x1080.jpg](p3-heads-play-1920x1080.jpg). The three developer looks `?cam=head`, `?cam=head34` and `?cam=headfront` (with `&still=1`) frame head B like the reference sheets.

**Changes of design, from the images over the blueprint.** The horns are a lyre as in images 08 and 14: close at the brow, out to 1.31 units either side, tips back in to 0.92 (the blueprint's stations ran straight out to 0.98; the first pass's 1.3 p tip spacing is withdrawn). The neck is as stout as the carving's, 0.47 either side at mid-height and 0.59 at the foot, against the blueprint front outline's 0.30 and 0.43. The ridges stand 1.8 times the blueprint's measure.

**Still to refine, by the owner's eye:** the fine transverse lines on the horns' sides and the hair on the forehead (both texture rather than shape), and how the heads read under the night firelight, which is darker than the studio.

## Part 4: the rendering foundation repaired

The experience audit of 2026-11-10 found three rendering settings that were not doing what the scene asked. All three are repaired in `apps/web/src/scene/Post.tsx`, `postPlan.ts`, `SceneRoot.tsx` and `world/Lights.tsx`. Each image below is the same view before (top) and after (bottom), from headless Chrome's software renderer.

- **Depth of field focused 0.02 units in front of the lens**, so on the high tier the whole frame was at full blur. It is now focused on the board's centre in every view, with a range of 30 units: the board and heads are sharp, the hut and trees soften. [p4-render-play-high.jpg](p4-render-play-high.jpg) · [p4-render-home-high.jpg](p4-render-home-high.jpg)
- **No tone mapping on the tiers with an effect composer.** The composer switches the renderer's tone mapping off and the chain added none back, so bright values clipped. The chain now maps tones after bloom and depth of field and before grain, vignette and grade.
- **The shadow type asked for had been removed from three.** `shadows="soft"` names a type three r186 no longer has; it substituted its percentage-closer type with a warning. That type is itself soft, by each light's shadow radius, which was left at one texel. The scene now asks for it by name and sets the fire's shadow radius to 2.5 texels of the 1024 map, scaled so the 512 map is as soft.

**A change of design: the tone curve is Khronos Neutral, not the spec's AgX.** Under a composer nothing can skip tone mapping, and the flame, embers, sky and the cups' glowing rings are authored as the colours they should show. AgX drains bright saturated colour by design: tried first, it turned the fire pale pink and the ember rings peach. Neutral leaves in-range colours as they are and rolls the highlights off, so the fire is orange rather than clipped yellow and the rings stay ember. The renderer's own curve, which only reaches the screen on the minimal tier, is Neutral too, so lit surfaces follow one curve on every tier; that tier is a little darker and more contrasted than it was under AgX. [p4-render-play-minimal.jpg](p4-render-play-minimal.jpg)

**Not judged here:** the shadow softness (the captures' grazing firelight does not show it clearly) and the final colour, both of which want a real GPU and the owner's eye.

## Part 5: the board alone in daylight, and the case-leather interface

The owner asked for three things on 2026-11-10: everything but the board taken out of the scene, daylight in place of the night, with every part of the board textured as in the design photographs, and a more artful, vintage interface in the manner of the inspiration designs.

### The scene

- **Only the board is mounted.** `SceneRoot.tsx` mounts the studio, the board and the post chain. The night world's modules (hearth, hut, trees, props, mat, sky) are still in `scene/world/` but nothing mounts them; the fireside ambience and the ember burst are off with them.
- **A daylight studio** (`scene/world/Studio.tsx`): a paper-coloured backdrop, a neutral room environment for the wood's reflections, sky light, and one key light from the upper left that throws the board's shadow on the floor. The teal-and-amber grade is out of the post chain; bloom, grain and vignette are turned down for daylight.
- **The wood** is one material family cut "from the block" (`scene/board/woodMaterial.ts`): long grain on the top and sides, end grain on the two ends, the grain running up the heads and along the horns. The cups darken towards the bottom, and the carved band's cuts are shaded from its height map. Colour and grain are taken from design images 01, 17 and 18.
- **The pebbles** are the eight river-stone colours of image 19, each with a fine speckle.

The board on its own: [p5-board.jpg](p5-board.jpg). Before, for comparison: [p4-render-home-high.jpg](p4-render-home-high.jpg).

### The interface

The interface is drawn as the fittings of the object: the board's case. Oxblood leather, brass inlay and bone lettering; the only ornament is the board's own carved band, and the crest is the blueprint's ibex head.

- **Two leather bars** frame the board, top and bottom, each edged with the band. On the home screen the top bar carries the name either side of the crest and the bottom bar carries the ways to play; the setup questions are answered in the same bar. In play the bars carry the two players, the round's plaque, the turn caption and the menu.
- **Panels** (toss, round summary, result, pause, about, lesson) are leather with stepped brass corners and an oxblood title band. The toss, summary and result sit along the bottom, and the cameras hold the board above them.
- **Buttons** are notched plaques; medallions have a milled bezel; the icons are solid stamps.

| Home | Play | Pause |
|---|---|---|
| [p5-home.jpg](p5-home.jpg) | [p5-play.jpg](p5-play.jpg) | [p5-pause.jpg](p5-pause.jpg) |

| Round summary | Result | Phone, 844 × 390 |
|---|---|---|
| [p5-round-summary.jpg](p5-round-summary.jpg) | [p5-result.jpg](p5-result.jpg) | [p5-phone-home.jpg](p5-phone-home.jpg) · [p5-phone-play.jpg](p5-phone-play.jpg) |

**Copy changed with the scene:** the loading line is now "Setting out the board…" (`ገበጣውን እያዘጋጀን ነው…`, in `docs/i18n-review.md` for the owner's reading), and the home bar's About button reads "About Gebeta". The no-WebGL still (`apps/web/public/home-still.webp`) is the daylight board.

**Not judged here:** the captures are from headless Chrome's software renderer, so the final colour and the frame rate on a phone still want a real GPU and the owner's eye. The stones are still the blueprint's 10 mm.

## Part 6: the yard, and motion

The owner asked on 2026-11-10 for every element of the game to be scored, for what would take each to 10, and for that to be built, to the standard of a video game. The scores and the plan are in [`../../review-2026-11-10.md`](../../review-2026-11-10.md). This part is what was built against it.

### The yard

The board is no longer in a studio. It lies on a woven mat in a highland homestead's yard, in daylight.

- **Light and air** (`scene/world/Daylight.tsx`): the sun as the one hard light, the sky as the fill and as what the oiled wood reflects, haze that pales things with distance, and dust drifting in the sunlight.
- **Sky** (`DaySky.tsx`): a blue gradient, the sun's glow, two layers of drifting cloud, and three ridges of mountains one behind another. All of it is worked out in the shader; nothing is downloaded.
- **Ground** (`Yard.tsx` and the modules it mounts): packed earth, the mat with a dyed red ring and a frayed fringe, tufts of dry grass moving in the wind, the coffee pot on its brazier with a tray of cups, a woven basket, the round thatched house across the yard, and acacia and eucalyptus beyond.
- **Leaf shade** (`leafShade.ts`): moving, dappled shade on the ground round the board. The board itself sits in a sunlit clearing, so the cups and stones are always in plain light.

The yard alone: [p6-yard.jpg](p6-yard.jpg). This picture is also the new no-WebGL still.

### Cameras

- **Home** is a low, wide three-quarter view with the yard behind the board. It stands back on narrow screens and tips so the picture sits between the two bars.
- **The opening** is a crane shot: the camera comes down from over the yard to the home view as the loading screen lifts.
- **The result** is low and wide, the hills behind the board, swinging slowly either side of broadside.

### Stones

How each kind of move looks is in `scene/stoneMotion.ts`, with tests.

- Stones are lifted out of a cup one after another, with a little pop.
- A sown stone is tossed from the hand, falls faster as it goes, and bounces once. The rest of the hand hops along.
- Captured stones swirl up and stream to the store one behind another.
- The deal at a new round, and the sweep at a round's end, go in high arcs.
- Every stone tumbles in the air and comes to rest at its own angle.

### Feedback

- A "+4" rises from the capturing player's store, in that player's colour.
- A ring snaps out from a cup where four are captured, and where a hand relays.
- The player's plate counts a capture when its stones land, not when the move is made.
- Gold dust goes up from the board at the result.
- While the pointer, or the keyboard's focus, is on a cup that can be played, the cup its hand of stones will run out in carries a pale ring and a small bone diamond ([p6-landing.jpg](p6-landing.jpg): cup 1 in focus, cup 5 marked). It shows the first lap only.

### Interface motion

- The home screen assembles itself: the bars slide in, the crest turns into place, the menu plaques are dealt in one after another.
- Plaques and medallions press. The turn caption comes in afresh when the turn changes, and the plate whose turn it is rings once.
- The result panel builds in steps and its score counts up. In the round summary each home is set down in turn.
- All of it is switched off under reduced motion.

### Smaller things

- "Start again" and "Quit" in the pause menu ask once: the first press arms the button, the second does it.
- The tiers below the high one are multisampled, so edges are no longer stair-stepped there.
- A count disc used to jump sideways for a moment whenever its number changed. It now flashes in place.
- The ambience is a breeze, leaves and birds in place of the fire and the crickets.
- A stone landing in a cup is a knock on wood, not a thump on earth. A capture adds two rising plucked notes; the end of a round, and a game won, lost or drawn, each have a short phrase on a plucked string, in the five notes of the tizita major scale.

| Home | A capture | Result | Phone |
|---|---|---|---|
| [p6-home.jpg](p6-home.jpg) | [p6-capture.jpg](p6-capture.jpg) | [p6-result.jpg](p6-result.jpg) | [p6-phone-home.jpg](p6-phone-home.jpg) |

**Checked:** typecheck, 211 unit tests, 36 of 36 end-to-end tests, and the download at 1,630.2 KB gzip of the 2,929.7 KB budget.

**Not judged here:** the sound, which cannot be heard from this machine's test browser; the frame rate on a phone, now that the scene holds a yard; and the final colour, since the captures are from headless Chrome's software renderer.

**Still open from the review:** trees and props with more shape than cut-outs and lathes. The night scene's modules (hearth, flame, embers, smoke, night sky, its lights) are still in `scene/world/` and nothing mounts them.

## Part 7: the yard cleared, real wood, carved heads, a view you can take hold of

The owner's four points of 2026-11-10 after seeing part 6.

- **The yard is cleared.** The coffee pot, the cups and the basket are gone; the board has the mat and the yard to itself. The house, the trees and the ridges stay as the setting.
- **The wood reads as wood** (`scene/board/woodMaterial.ts`). It is walnut-brown rather than orange. It has open pores, short dark dashes lying along the grain. The grain has fine relief, worked out from the photograph itself, so no normal map is downloaded. The finish is a hand-rubbed oil, satin and uneven, with the soft sheen wood has at a grazing angle. The carved band's cuts and the cups' depths are darker.
- **The heads are carved more boldly** (`sculpt/sdf.ts`), after images 07 and 11. The eye is a full almond with heavy lids, a crease and a brow; the mouth line, the lips and the nostrils' wings are cut deeper; the beard and the forehead have chiselled locks; the ear is a broad hollowed leaf. Shade is baked into every cut when the head is built, so the carving shows in any light. A head is now 16,000 triangles.
- **The horns are massive** (`sculpt/horn.ts`): deeper and wider than the traced stations along their length, with a squared section, and still slim at the root so nothing of them reaches down the face. Their sides carry the fine cut lines of the carving and one long line down their length.
- **The play area answers the hand** (`scene/CameraRig.tsx`). Dragging turns and tilts the view, a pinch or the wheel brings it nearer, and a double tap puts it back. In play the view stays where it is left and a reset medallion appears in the bottom bar. On the home and result screens the board can be turned all the way round and drifts back after five seconds. With a mouse the view leans a little towards the pointer.

| Head before | Head after | Play | Play, turned and brought nearer |
|---|---|---|---|
| [p7-head-before.jpg](p7-head-before.jpg) | [p7-head-after.jpg](p7-head-after.jpg) | [p7-play.jpg](p7-play.jpg) | [p7-play-turned.jpg](p7-play-turned.jpg) |

**Checked:** typecheck, 211 unit tests, 36 of 36 end-to-end tests, the download at 1,684.6 KB gzip of the 2,929.7 KB budget, and a scripted drag, zoom and reset in a live game.

**Not judged here:** how the drag and the pinch feel under a finger, and the frame rate with the heavier heads, both of which want a real phone.

**Still open:** the necks stand on the board as posts; in the reference they flow into it. The muzzle's length follows the traced outline and was not changed.
