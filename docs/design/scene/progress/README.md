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
