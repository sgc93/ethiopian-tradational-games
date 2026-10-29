# Gebeta board blueprint

Dimensioned drawings of the carved wooden Gebeta board with two Walia ibex heads, detailed enough to build the 3D model from. They were drawn from the owner's reference images in `../images/` (see `../image-brief.md`).

All lengths are in millimetres, with game units in brackets. **1 p = 50 mm**, where p is one cup pitch, the same unit as `apps/web/src/scene/layout.ts`. The axes are as follows:
- +x runs towards player A's store, on A's right.
- +y is up.
- +z runs towards player A.
- The origin is the centre of the board's top face.

## Sheets

| File | What it shows |
|---|---|
| [board.svg](board.svg) | Sheet 1: plan, front and end elevations, a lengthways section through the stores and necks, a cross-section through two cups, and the foot |
| [ibex-head.svg](ibex-head.svg) | Sheet 2: top, side and face views of one head, the horn centre line and sections, and the 24 ridges |
| [band.svg](band.svg) | Sheet 3: one repeat of the carved band, fully dimensioned, with a relief section, a height-map preview and the layout round the side |
| [band-height-tile.svg](band-height-tile.svg) | One exact repeat of the band as a grey height map (white is the surface, black is cut 1.5 mm deep). It tiles seamlessly. |
| [board-dimensions.json](board-dimensions.json) | Every number on the sheets, plus the outlines, horn sweep stations and band motif, in game units for the 3D build |
| [ibex-outlines.json](ibex-outlines.json) | The traced silhouettes in mask pixels, which are the input to the sheets |

## Main dimensions

| Part | Size |
|---|---|
| Body | 605 × 128 × 62.5 (12.1 × 2.56 × 1.25). Plan is rounded at both ends, R 64 (1.28). Top edge R 7.5 (0.15), bottom edge R 5 (0.1). |
| Cups | 12 cups, Ø 44 (0.88), 18 (0.36) deep, spherical (R 22.4). Pitch 50 (1). Rows 57.5 (1.15) apart. Hole numbers match the game. |
| Stores | 2 stores, centred at x ±187.5 (±3.75). Ø 70 (1.4), 22.5 (0.45) deep, spherical (R 38.5). |
| Feet | 4 square feet, 42.5 (0.85) wide and 27.5 (0.55) tall, edges chamfered 3 (0.06). Centres at x ±245, z ±35. |
| Heads | 2 heads, neck axis at x ±262.5 (±5.25), facing each other. 160 (3.2) tall. Horn back 73 behind the neck axis, muzzle 79 in front. Horn spread 113.5 (2.27). |
| Band | 45 (0.9) tall, centred on the side, cut 1.5 (0.03). 32 repeats of 42.4 (0.848) round the 1356 (27.12) perimeter. |
| Overall | 250 (5.0) high to the horn tops. 672 (13.4) long over the horns. |
| Stones | 10 (0.2) across, nominal. |

## Rulings: where the images disagreed

1. **Cup count.**
   - Image 01 has 5 + 5 cups; image 02 has the correct 6 + 6 + 2 stores.
   - The layout follows 02 and the game grid. Image 01 no longer needs fixing for the blueprint.
2. **Board size.**
   - The brief said about 56 × 15 × 3.5 cm. The cup pitch is fixed by the game at 50 mm, and images 02 and 03 put 12.1 pitches end to end, so the board is 605 long.
   - Width is 128 (from 02) and thickness 62.5 (from 03).
3. **Stores and necks.**
   - Image 03 puts the stores at about ±3.72 p. They sit at ±3.75 so the neck foot fits between the store and the board end.
   - The fit is tight: the neck's flare clears the store rim by 1.5 mm and the board end by 1.3 mm.
4. **Head height.** 160 (3.2), as in the brief and image 03. The side silhouette 13 is scaled to that height and is the master view for every height and length.
5. **Horn spread. Confirmed by the owner on 2026-10-29.**
   - The images disagree on the spread, measured outside the horns:
     - 02: about 0.9 p
     - 09: about 1.3 p
     - 04: about 2.2 p
     - 14: about 4.3 p
   - I used 04's spread (113.5 mm), because 04 is the only straight-on end view and it gives the arched look of 04 and 11.
   - From above, the horns then splay out in a V (sheet 2, top view). The owner chose to keep this wide spread. Narrowing it later is a one-number change (`HORN.tipZ` in the script).
6. **Face view.**
   - The front silhouette 14 draws the head about twice too wide.
   - It is narrowed to 04's proportions: neck 30 (0.6) at its narrowest, ears 55 (1.1) across. Its heights are scaled so the ear tips meet the side view's.
7. **Top view.**
   - 09 shows the face from above but hides the neck under the horns.
   - Behind the ears, the top view is filled in from oval neck sections taken from the side and face views.
8. **Horns.**
   - The centre line, depth and ridges are traced from 13.
   - The sideways sweep and width are designed, because no image shows them reliably.
   - The 24 ridges taper from 2.2 mm high and 11.5 mm apart at the root to 0.3 mm and 5 mm at the tip.
9. **Band height. Confirmed by the owner on 2026-10-29.**
   - The brief asked for about 15 mm. Images 03, 04 and 15 all show a band filling most of the side, so it is 45 mm, with rims and window rows above and below. The owner chose to keep 45 mm.
10. **Band motif.**
    - It is redrawn as clean geometry with the rhythm and proportions of image 15:
      - a tilet zigzag
      - stepped pyramids
      - Aksum stelae window rows
    - It contains no religious symbols.
    - 32 repeats make a quarter turn exactly 8 repeats. That puts a zigzag peak at the middle of each long side and at the tip of each end.
    - `band-height-tile.svg` replaces image 16 (the height map), which is no longer needed.
11. **Feet.**
    - Image 05's proportions are wrong, so only its foot shape is used (square, chamfered).
    - Positions come from 03 and 04.
12. **Stones.**
    - The board's 10 mm stones are bigger than the game's current `STONE_SIZE` of 0.11 (5.5 mm across).
    - The new cups are also bigger (44 × 18 mm against today's 40 × 11), so stones can grow when the board goes in. Check crowding then.

## Building it in 3D (later)

- **Body:** extrude the rounded plan, round its edges, then subtract the 14 spheres for the cups and stores. Add the 4 chamfered feet.
- **Head without horns:** intersect the extruded side, face and top head-only outlines (`heads.outlines.*HeadOnly`, side as master), then smooth the result. Blend the neck into the top with R 7.5 (0.15).
- **Horns:** sweep an oval along `heads.horn.stations`, a mirror pair at ±z. Add the ridges on the outer face at the listed `t` and heights.
- **Band:** use `band-height-tile.svg` as a bump or normal map, 32 tiles round the side, starting with a peak at the middle of player A's side.
- **Game layout:** `gameLayoutChanges` in the JSON lists the layout constants that change.

## Regenerating

The masks are scratch files; keep them out of the repo. Run from this folder:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File tools/make-masks.ps1 -OutDir <scratch-dir>
node tools/trace-outline.mjs <scratch-dir> ibex-outlines.json
node tools/make-blueprint.mjs
```

`make-blueprint.mjs` holds every design number and decision listed above, with comments. Change a number there and rerun it to update all three sheets and the JSON together.
