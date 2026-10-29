# Teret: the fireside game scene and interface

**Date:** 2026-10-29
**Status:** draft, waiting for the owner's approval
**Builds on:** the prototype design (`2026-10-28-gebeta-web-prototype-design.md`) and the board blueprint (`docs/design/board/blueprint/`)

This document is the full description of the new look of the game: the 3D world the board sits in, the board itself, the stones, light, motion and camera, and every screen of the interface.

The pixel layout of each screen is in `docs/design/scene/mockups/screens.html`. Open it in a browser; a button there shows the safe areas. Renders of each frame are in `docs/design/scene/renders/`, and the look we are aiming for is `docs/design/scene/mockups/teret-key-art.jpg`.

## 1. Why

The prototype works, but it looks like a prototype: holes scooped in flat earth, plain cards and buttons. The owner wants the game to feel like a video game made with care. The standard is the set of AAA game interfaces in `inspiration-designs/`:
- **Enotria: The Last Song:** antique-gold line icons on dark slate, serif capitals, thin frames with diamond corners.
- **Diablo IV: Lord of Hatred:** black iron and crimson, ornate headers, the world always visible behind the menus.
- **A sci-fi mech selection screen.**

The app exists to show the world what an Ethiopian childhood was like. So the look must come from Ethiopia itself, not from borrowed gothic or Renaissance ornament.

**Success, as the owner would see it:**
- Opening the game on a phone feels like opening a real game. A night scene by the fire, with the carved ibex board glowing in the firelight, is alive from the first second.
- The interface looks like it belongs to that world: gold, quiet and premium, and never in the way of the board.
- What happens on the board and what the interface says always match, moment to moment.
- It still loads fast on Ethiopian mobile data and runs smoothly on a cheap Android phone.

## 2. Decided by the owner (2026-10-29)

- **Theme: Teret, by the fire.** Night outside a round highland hut. It's the hour when children played gebeta and listened to *teret*, the old stories.
- **The board:** the carved wanza-wood board with two Walia ibex heads, exactly as in the blueprint. That includes the wide horn spread (113.5 mm) and the 45 mm carved band, both confirmed by the owner.
- **The bar:** video-game-level scene and interface, in the spirit of the inspiration folder.
- **Landscape only.** When the phone is held upright, a "turn your phone" screen shows.
- **Assets:** images are generated, then processed into textures and art. The 3D models are built for the game.
- **Who generates them:** the designer, with the owner's Freepik account (section 10). Images made this way count as "made by us" under the prototype's licence rule.
- **No religious symbols anywhere** (carried over from the board design).

Everything else in this document is the designer's call. Section 13 lists those calls, so the owner can check them.

## 3. Goals, non-goals and anti-goals

**Goals**
1. A cinematic night scene, lit mainly by firelight, around the blueprint board.
2. A living world that moves constantly without ever crossing the board or competing with a turn.
3. An interface in sync with the 3D scene:
   - labels pinned to the cups
   - feedback shown in the world itself: glowing cups, gold rims, a coin that flips in 3D
   - camera moves choreographed for the big moments
4. Every existing screen redesigned (section 9), plus a loading screen and a "turn your phone" screen.
5. Both languages throughout, with Ge'ez script treated as a display face rather than an afterthought.
6. The prototype's budgets kept: a first download of 3 MB at most, at least 30 frames a second on a low-end Android phone, and offline play.

**Non-goals**
- People, hands or characters in the scene. The stones move by themselves, as they do now.
- Real-time path tracing or any effect that only a top graphics card can run.
- New rules, new game modes, online play or accounts.
- A music score. The scene has ambient sound and effects only; music can come later.

**Anti-goals** (a failure even if everything else works)
- Anything that hides a cup, a stone or a count while a player is choosing.
- Busy interface chrome over the board, or motion that pulls the eye during a turn.
- A cartoon or mobile-casino look: no bouncing, no confetti, no glossy plastic.
- Religious imagery of any kind, including on the toss coin.
- Text too small or too faint to read on a phone.
- A long blank wait at start-up.

## 4. Constraints

These are unchanged from the prototype design, section 6:
- **Platform:** phone and desktop browsers with WebGL 2. Nothing may rule out wrapping the game with Capacitor later.
- **Download:** the first load is at most about 3 MB compressed. Today's build is 894 KB, which leaves about 2 MB for the new scene (budget in section 10).
- **Speed:** at least 30 frames a second on a low-end Android phone in Chrome, and 60 on mid-range phones and desktops.
- **Offline after the first visit:** the service worker's precache must include every new asset.
- **Accessibility:**
  - The hidden keyboard and screen-reader hole buttons stay.
  - Turn changes are still announced.
  - "Reduce motion" is honoured.
  - Focus is always visible.
- **Unchanged:** the rules package, the game controller and session, playback planning, saved games and the computer player.

## 5. The world

All positions are in game units (p). 1 p = 50 mm = one cup pitch, using the same axes as the blueprint:
- +x runs towards player A's store.
- +y is up.
- +z runs towards player A.
- The board's top face is at y = 0, and the ground is at **y = −1.8**, under the feet.

**Everything is life-size, next to a real 60 cm board.** Real sizes come first in the table, with game units in brackets.

The plan from above is `docs/design/scene/mockups/set-plan.html`. The set is arranged so that **both seats see a full scene**: the fire is at one end of the board and the hut beyond the other, never behind a player.

| Piece | Where (p) | Real size (p) | Made from |
|---|---|---|---|
| Board, heads, horns | origin | blueprint: 60 cm long, heads 16 cm tall | built in code from `board-dimensions.json` (section 6) |
| 48 stones | in the cups and stores | 10 mm (0.2) | the existing irregular-pebble generator, scaled up |
| Woven mat | centre, on the ground | oval 1.1 × 0.65 m (22 × 13), 2 mm thick | flat disc with a weave texture; a frayed fringe at the edge, alpha-tested |
| Ground | all round | disc of radius 30 m (600), fading into fog | packed red-brown earth texture, with scattered straw, small pebbles and a few eucalyptus leaves as instanced decals |
| Hearth | centre (−26, −1.8, −2), about 1 m beyond the board's B end. The ring's edge is 60 cm clear of the horn tips. | stone ring radius 35 cm (7); stones 15–20 cm; logs 50–70 cm long and 6 cm thick; flames 40–60 cm tall (8–12) | 9 rough stones, 6 crossed eucalyptus logs with glowing charred ends, a bed of embers, and the flame (section 7) |
| Coffee corner | beside the hearth: a jebena on a small clay charcoal brazier at (−20, −1.8, −9), and a tray of six small cups at (−15, −1.8, −11) | jebena 25 cm tall (5); cups 5 cm | turned shapes in dark glazed clay. Steam rises from the spout, and the brazier's coals glow and pulse. |
| Stool and gabi | by the hearth: a stool at (−32, −1.8, 10), with a folded white cotton gabi with a tilet border lying on it | seat 30 cm high (6) | simple carved low stool; the gabi's border repeats the board's band |
| Basket | by the hearth, (−20, −1.8, 9) | 30 cm tall (6) | a small lidded basket: a turned shape with a weave texture |
| Round hut | centre (150, −1.8, 0), 7.5 m beyond A's end, door facing the board | wall radius 3 m (60), height 1.8 m (36); thatch cone radius 3.4 m, height 2.5 m (50); doorway 0.9 × 1.5 m | cylinder wall (mud plaster) and cone roof (thatch); the doorway glows warm from inside |
| Trees | a loose ring at 20–40 m (400–800) | 10–20 m tall | eucalyptus and acacia silhouettes as soft dark billboards, swaying slightly |
| Mountains | on the sky dome | — | one seamless ridge-silhouette strip, behind the trees |
| Sky | dome at 100 m (2000), which is also the camera's far limit | — | deep blue-black with twinkling stars, a moon with a soft halo high behind the far end, and two thin cloud layers drifting slowly past it |
| Fog | everywhere | — | exponential-squared fog the colour of the night ground (#0a0806), about half-faded at 12 m (240). The hut reads as a dim warm shape; the trees read as silhouettes against the sky. |

**What each view sees:**
- **The play view looks down at 48°, so it shows no sky.** It shows the board on its mat, with bare, firelit ground around it:
  - **Nothing else stands in the play frame.** Props there would sit behind the player plates and the round banner.
  - **The fire, its props and the hut sit outside the frame.** The fire is felt through its flickering light, the long shadows, and the embers and smoke drifting across the top of the frame.
- **The sky, moon, hut, trees, the fire and its props** show on the home screen, at the loading flare and during every camera move.

## 6. The board, the stones and the cups

- **Geometry:** follows the blueprint exactly:
  - Board 605 × 128 × 62.5 mm with rounded ends.
  - 12 cups, 44 mm across and 18 mm deep, as spherical caps.
  - 2 stores at x ±3.75, 70 mm across and 22.5 mm deep.
  - 4 chamfered square feet.
  - 2 ibex heads at x ±5.25, facing each other.
  - The carved band all round the side: 32 repeats.
- **Board body:** build it with no boolean (CSG) library:
  - the top face as a shape with 14 round holes
  - each cup and store as a lathed spherical cap
  - each rim as a small rounded lip
  - the sides extruded with the 7.5 mm top and 5 mm bottom roundings
- **Heads:**
  - **Without horns:** the intersection of the side, face and top "head-only" outlines in the blueprint JSON, with the side view as the master, then smoothed.
  - **Horns:** a mirror pair, each swept along the 41 horn stations with an oval cross-section. The 24 ridges sit on the outer face at the listed positions and heights.
  - **Neck:** blends into the top with a 7.5 mm rounding.
  - **Triangle limits:** 8,000 per head and 6,000 per horn, halved on the low tier.
  - **Where the mesh is made:** either at start-up in a worker or ahead of time, but with no 3D decoder larger than 10 KB.
- **Wood material** (one physically based material for board and heads):
  - Surface: wanza wood colour, with a light hand-rubbed oil finish (clear coat 0.25, roughness 0.35).
  - Roughness: around 0.55 underneath.
  - Detail: a subtle grain normal map, plus the carved band's normal map (made from `band-height-tile.svg`) on the side.
  - Cups: slightly darker and smoother inside, worn by hands, with ambient occlusion baked into the bowls.
- **Stones:**
  - Shapes: irregular river pebbles about 0.2 across (10 mm), from the existing generator, scaled up.
  - Colours: six tones taken from `images/19-pebbles.jpg`.
  - Surface: roughness 0.45–0.7.
  - Rendering: drawn as one instanced mesh.
- **Game layout changes:**
  - Cup radius 0.44 and depth 0.36 (the blueprint's `gameLayoutChanges`).
  - The stone size grows to 0.2.
  - Stone heaps are re-tuned to the deeper cups.
  - **Captured stones go into the owner's store cup**, not beside the row. Homes stay readable on the player plates (section 9).
- **Camera fit:** must now include the heads and horns. The measured framing is in section 8.

## 7. Light, motion and effects

### Lighting

The renderer uses AgX tone mapping, sRGB output and soft shadows. The values below are starting points; tune them by eye until the scene matches the key art.

| Light | Where | Colour | Role and behaviour |
|---|---|---|---|
| **Fire** (point light) | (−26, 3.5, −2), in the heart of the flames, about 25 cm above the ground | #ff8f3f (about 1900 K) | The key light. It sets the direction of everything: faces turned to the fire glow, and the far sides fall into shadow. **Flicker:** intensity × (0.85 + 0.15·n), where n mixes sines at 7.3, 11.1 and 17.9 Hz with a slow 0.6 Hz swell. The position jitters by ±0.3. |
| **Fire shadows** (spot light at the fire, aimed at the board's centre) | (−26, 4.5, −2) | same | Casts long, low, flickering shadows of the stones, heads and horns across the board towards the hut end. The low angle makes them long. The shadow frustum covers only the board and mat (±16). Shadow map 1024 (512 on the low tier), soft-edged. A spot light, not the point light, because point-light shadows cost six renders. |
| **Warm fill** (directional, no shadows) | from the upper left, direction (−0.55, 0.8, 0.2) | #ffb070 | Stands in for firelight bouncing off the ground and the glow of the flames. A real fire this low only grazes the board's top, so this makes the top read warmly, as in the key art: about 70% brightness on the fire side, falling away towards the hut end. |
| **Moon** (directional) | from (8, 20, −14) | #8fb4ff | A cool rim on horns, stones and the hut roof. Intensity about 5% of the fire's at the board. No shadows. |
| **Hut doorway** (point light) | (88, 12, 0), just inside the door | #ffb35c | A warm glow spilling out of the door at the far end, with a slow, gentle flicker. No shadows. |
| **Ambient** (hemisphere) | — | sky #1b2740, ground #2a1408 | Just enough that nothing goes fully black. |

Reflections on the oiled wood and the stones come from a tiny procedural environment: dark, with a warm glow on the fire side. Nothing is downloaded for it.

### Always-on motion (never over the board)

| What | How | Tier counts |
|---|---|---|
| Flame | 3 crossed billboards with a scrolling-noise flame shader, plus a glow sprite. 40–60 cm tall (8–12), flickering in step with the light. | all |
| Embers | GPU points rising from the fire to about 2 m (40) on a light breeze towards +x. Some drift across the top of the play frame. They live 2.5–5 s, are 2–4 px across, and shade from #ffb060 to #ff5a1a. | high 160, mid 90, low 40, minimal 24 |
| Smoke | Soft, low-opacity billboards rising and drifting towards +x, gone by about 4 m (80). | high 14, mid 10, low 6, minimal 4 |
| Steam | 4 small soft sprites above the jebena spout. | all |
| Sky | Stars twinkle; two thin cloud layers drift past the moon (about 20 s to cross it). | all |
| Grass | Short blades around the mat's edge and on the ground nearby, swaying in a vertex-shader wind. | high 3000, mid 1500, low none (texture only) |
| Hut doorway | Glow flickers slowly. | all |
| Camera breathing | The play camera drifts ±0.04 on two slow sine waves (7 s and 11 s). | off when "reduce motion" is on |

### Game feedback in the world

- **Playable cups:**
  - An ember-gold ring (#ff9a3c) on the cup's rim, pulsing between 40% and 100% every 1.6 s.
  - Their count discs light up to match.
  - The suggested cup in a lesson pulses brighter and faster (1.0 s).
- **Touch and hover:** the rim brightens under a finger or pointer; a press tightens the ring by 4%.
- **Sowing:**
  - Picked-up stones rise and hover above the cup they came from, as today.
  - Each stone arcs to the next cup.
  - On landing: a wooden click, 6–10 dust motes puffing up for 0.4 s, and its count disc ticking (section 9).
- **Captures:**
  - The four stones lift together in an arc into the owner's store (0.6 s).
  - About 20 gold sparks rise from the cup, the store glows briefly, and the owning ibex's eye catches a glint of light.
  - The camera eases 3% towards the cup and back.
- **Turn change:**
  - The firelight swells slightly towards the player whose turn it is (about 10% for 0.8 s).
  - The plates and the caption change (section 9).
- **Ownership:**
  - Cups owned by player A get a gold rim inlay; player B's get silver-blue.
  - The inlays show at the end of a round and stay faintly visible during a match.

### Post-processing

- **Bloom:** threshold 0.85, intensity 0.6, catching the fire, embers, glows and gold.
- **Vignette:** offset 0.35, darkness 0.65.
- **Film grain:** 6% overlay.
- **Colour grade:** teal-tinted shadows and amber highlights.
- **Depth of field:** high tier only; focused on the board, so the hut and the trees soften.
- **Anti-aliasing:** SMAA on the high tier.
- **Low tier:** half-resolution bloom, no depth of field, no SMAA.

## 8. Camera

All values come from the projection used for the mockups (`docs/design/scene/tools/frame.mjs`).

- **Play view** (each seat):
  - Settings: tilted 48° down, 30° vertical lens, 16.25 back from the target (0, 0.4, 0).
  - Result: on an 844 × 390 screen, the board, heads and horns sit between x 80–764 and y 63–300.
  - That leaves clear bands for the interface at y 12–56 (top) and y 313–357 (bottom).
  - Other screen shapes keep the same tilt and lens, and the distance adjusts until the board, heads and horns fit inside the same margins.
  - Players may drag to look around a little (±15° around, 38°–58° tilt, zoom 0.9–1.1). The view eases back after 2 s.
- **Seat change** (two players): a 1.4 s arc around the board's fire end, rising high enough on the way to show the flames beyond.
- **Home:**
  - **Position:** on player A's side, about 1.1 m (22) from the board's centre, 10–25 cm (2–5) above the board's top.
  - **Aim:** at a point between the board and the fire.
  - **Movement:** a slow arc of ±25° and back, once a minute, eased at the ends. It never circles the whole set.
  - **In frame at every moment:** the fire and the nearer ibex head, as in the key art. The hut glows dimly beyond.
  - **Clearance:** it never comes closer than 10 cm (2) to any prop.
  - **Focus:** on the board.
- **Coin toss:** the camera rises to look nearly straight down (84° tilt, 15.5 back) over 1.0 s.
- **End of a round:** the same top-down view (1.2 s).
- **Result:** a slow orbit at 35° tilt, one turn every 40 s, about 0.9 m (18) from the board's centre. That keeps it above and inside the props, and it never sees the back of the hut.
- **Reduce motion:** no breathing and no orbit. Moves become 200 ms cross-fades.

## 9. The interface

### Design tokens

These are exact. They also appear at the top of `screens.html`.

| Token | Value | Use |
|---|---|---|
| ink-950 / 900 / 800 / 700 | #0a0806 / #120e0a / #1b1510 / #261d15 | grounds and panels |
| gold-200 / 300 / 400 / 500 / 700 | #f1dcaa / #e6c88e / #d6ae6a / #c09553 / #7d5f33 | titles, lines, icons |
| ember-300 / 400 / 600 | #ffc27a / #ff9a3c / #d9661f | player A, "your turn", the main button glow |
| moon-300 / 500 | #b9cfee / #7f9cc4 | player B and the opponent's turn |
| text-100 / 300 / 500 | #f4ead8 / #cdbfa3 / #8f826b | body text |
| panel | rgba(13, 10, 7, 0.84) with a 12 px backdrop blur | every panel |
| line / line-soft | rgba(214, 174, 106, 0.55) / 0.18 | frame lines |

**Player colours come from the scene's two lights:** player A is firelight (ember) and player B is moonlight (silver-blue).

### Type

| Face | Weights | Use |
|---|---|---|
| Cinzel | 600, 700 | Latin titles, buttons, labels and numbers: capitals with wide spacing |
| EB Garamond | 400, 500, italic 400 | Latin body text, hints and button sub-lines |
| Noto Serif Ethiopic | 600, 700 | All Amharic, both display and text. It replaces Noto Sans Ethiopic. |

At the 390 px reference height the sizes are:

| Element | Face and size | Spacing |
|---|---|---|
| Logo ገበጣ | 58 | — |
| Panel title | Cinzel 17 | 0.22em |
| Small title | Cinzel 13 | — |
| Button | Cinzel 11.5 | 0.2em |
| Body | 14–15 | — |
| Caption and micro | Cinzel 10 | 0.26–0.3em |

Amharic is never uppercased or letter-spaced, and runs about 2 px larger than the Latin size it replaces.

### Scale and safe areas

- **Reference screen:** 844 × 390, an iPhone 14 held sideways at full height.
- **Safe area:** the device's insets (47 px at each side on iPhones, 21 px at the bottom). Everything sits a further 12 px inside.
- **Scaling:** interface sizes are multiplied by clamp(0.82, visible height ÷ 390, 1.6). The scene fills the whole screen behind, including under the notch.
- **Minimum sizes:** captions never drop below 9.5 px, body text below 12 px, buttons below 36 px tall, and medallions below 34 px.
- **Short screens:** in a browser, toolbars take part of the height. A typical Android phone in Chrome shows about 750 × 290, and the reference iPhone in Safari about 844 × 340. The game must work down to **300 px tall**.
  - **Compact layout, below 340 px:**
    - plates 164 × 38 (30 px avatar)
    - cartouche 150 × 28
    - count discs 20 px (26 for stores)
    - top and bottom interface bands 44 px instead of 56
    - the caption folds into the cartouche's second line
  - **The camera fit always uses the real band heights,** so the board takes whatever height is left between them.
- **Full screen:**
  - **Android:** the first tap on a Play button asks the browser for full screen, then locks landscape.
  - **iPhone Safari:** can't go full screen, and the compact layout covers it.
  - **Installed app:** declares landscape and full screen in its manifest. The manifest's orientation changes from "any" to "landscape".
- **Larger screens:** keep the same layout. Elements anchored to corners stay in their corners, and centred elements stay centred.

### Parts

| Part | Spec |
|---|---|
| **Panel** | Panel background with a 1 px line, an inner line inset 4 px, and 7 px gold diamonds at the four corners. The title has a 150 px divider with a diamond under it. |
| **Main button** | 40 high; gradient #6e4517 → #311d0b; 1 px #e3b56b border; ember glow (0 0 22px rgba(255,150,60,.35)). One per screen. |
| **Other buttons** | 40 high, 1 px gold border at 42%. Quiet buttons are text only. Choice buttons are 56 high, with an italic one-line explanation. |
| **Medallion button** | A 40 px circle (30 px small) with a double ring and an 18 px gold line icon. |
| **Player plate** | 188 × 44, rounded, with a 36 px avatar ringed in the player's colour, the name in Cinzel, then stones (pebble icon) and homes (hut icon, match only). **Whose turn:** an ember border and glow, plus a glowing diamond at the right edge. |
| **Cartouche** | 168 × 32, with pointed ends. "ROUND II OF V" over five diamond pips: done is gold, current is ember, still to come is outlined. A quick game reads "QUICK GAME". |
| **Caption** | Centred at y 52, Cinzel 10. Ember for your turn, moon-blue for the opponent's, with three pulsing diamonds while they think or play. |
| **Count disc** | 24 px (30 px for stores), dark, with a gold ring and a gold Cinzel number. Each disc is pinned to a point on the board, moving with the camera every frame: just outside the near row, just beyond the far row, and over each store's far rim. Playable cups' discs get an ember ring and glow. When a number changes, the disc grows to 115% and settles back over 160 ms with a gold flash. |
| **Ribbon** (lesson hints) | A band fading at both ends, 14.5 px text, key words in ember. |
| **Coin** | A real 3D gold coin. Its faces are the words **አንበሳ** and **ሰው** in raised Ge'ez letters, inside a sun-ray border. No lion, no crown, no emblem. |
| **Emblem** | An ibex-head medallion, drawn as a vector from the blueprint's side outline. Used for loading, results and the "you" avatar. |
| **Icons** | Gold line icons on a 24 px grid with a 1.5 px stroke: menu, sound, back, close, pebble, hut, ibex, opponent knot, phone, rotate. They're drawn by hand as SVG, not generated. |
| **States** | **Hover:** the border brightens and the glow grows. **Press:** moves 1 px down. **Focus:** a 2 px ember outline 3 px out. **Disabled:** 40% opacity, no glow. |
| **Motion** | **Panels:** in over 220 ms (fade plus a 12 px rise, cubic-bezier(.2,.8,.2,1)), out over 160 ms. **Plates:** their active state changes over 300 ms. **Captions:** cross-fade over 200 ms. **Reduce motion:** fades only. |

### Screens

Pixel positions are in `screens.html`, which is the reference. In brief:

1. **Loading** ("Lighting the fire…"):
   - The emblem, GEBETA, and a thin gold line filling as the scene loads.
   - When ready, the fire flares from black and its light spreads, then the home screen fades in.
   - Return visits skip straight to the flare (0.8 s).
2. **Home:**
   - The live scene, with the camera sweeping slowly by the fire (section 8).
   - The title block at the left: ገበጣ, GEBETA and the tagline.
   - The menu stack at the right (x 505, width 268): Continue (the main button when a game is saved), Play against the computer, Play with a friend, Learn to play, and About as a quiet link.
   - At the bottom left: the language switch and the sound medallion.
3. **Home → level, and Home → game type:** a panel replaces the menu stack in place, with a back chevron. The title stays put.
4. **Coin toss:**
   - The camera rises over the board.
   - The 3D coin waits between the rows.
   - A low panel offers "አንበሳ · Lion" and "ሰው · Person".
   - The coin then spins up (1.2 s), rings and lands. A panel names the side and who starts, with "Play".
5. **Play:**
   - **Top band:** the far player's plate at the top left, the cartouche in the centre with the caption under it, and the menu medallion at the top right.
   - **Bottom left:** the near player's plate.
   - **On the board:** count discs and cup glows.
   - **In two-player games:** "near" is always the player whose seat the camera is behind, so the plates swap when the camera swaps.
6. **Paused:** the scene keeps burning, blurred and darkened, behind a panel. It has Continue, toggle rows (Speed, Stone counts, Keep the view fixed (two-player only), Sound), Start again, and Quit to home.
7. **End of a round:**
   - The top-down view with the ownership inlays drawing round each cup in turn (0.6 s each).
   - The cartouche reads "END OF ROUND II".
   - A low panel across the bottom: each player's stones and next-round homes as rows of small huts, with Next round in the middle.
8. **Result:**
   - The orbiting scene with an ember burst from the fire.
   - A panel with the emblem, the headline ("You won!"), the score, the reason and the rounds played.
   - Play again and Home.
9. **Learning to play:**
   - The hint ribbon sits above the near plate, and the suggested cup pulses.
   - "Leave lesson" replaces the menu medallion.
   - Lesson cards use the standard panel.
10. **About:** a reading panel over the home scene.
11. **Turn your phone:**
    - Shows whenever the screen is taller than it is wide, including a desktop window narrowed to portrait.
    - Content: the emblem, a phone icon rocking 90° every 2 s, "TURN YOUR PHONE", a line in both languages.
    - The game pauses and the 3D scene stops drawing to save battery.
12. **No WebGL:** the message panel over a still image of the home scene (a WebP of about 60 KB, made from a render of the finished scene).

**New strings:** the loading line, "turn your phone" and its sentence, and "QUICK GAME" on the cartouche. They need English and Amharic. The Amharic goes to the owner for review, together with the existing outstanding Amharic review.

## 10. Assets and the download budget

### Generated images, then processed

Every texture is generated, or taken from the owner's reference images, and then processed by a repeatable script (`tools/assets/`, using sharp as a development dependency):
- made seamless (offset and cross-fade the seams)
- graded to the scene's palette
- resized
- normal and roughness maps derived from the image
- saved as WebP

The originals are kept in `docs/design/scene/sources/`. Generation prompts must say "no text, no people, no crosses, no religious symbols".

**Who makes the images and when** (owner's decision):
- The designer generates every "generate" row below with the owner's Freepik account (Mystic, realism), as the first task of the build. Nothing else waits on the owner.
- `sources/manifest.json` records, for each original: the prompt, the date, the tool and the chosen variant.
- Each texture is checked tiled 3 × 3 before it's accepted. If it shows seams, repeats or a wrong colour after processing, it's regenerated. After three misses, that texture is made in code instead (noise-based), so no asset can block the build.
- The owner sees all the processed textures on one contact sheet and can veto any of them.

| Asset | Source | Output |
|---|---|---|
| Wanza wood (board and heads) | `images/17-wood-texture.jpg`, darkened to match the board | colour 1024², normal 1024², roughness 512² |
| Carved band | `band-height-tile.svg` | normal map 512 × 544 |
| Packed earth | `images/20-ground-under-the-board.jpg` (already tiles cleanly) | colour 1024², normal 512² |
| Woven mat | generate: "top-down photo of a tightly woven natural grass mat, Ethiopian basketry, flat even light, seamless tileable" | colour 512², normal 256² |
| Eucalyptus bark | generate: tileable bark | colour 512² |
| Hearth stone | generate: tileable rough basalt | colour 512² |
| Thatch | generate: tileable dry straw thatch | colour 512² |
| Mud plaster | generate: tileable smoothed mud-and-straw wall | colour 512² |
| Mountain ridge | generate: "wide panoramic silhouette of Ethiopian highland mountains at night, flat layered tones, seamless left to right"; key out the sky | 2048 × 256 with transparency |
| Flame and smoke noise | made in code | 256² |
| Colour grade | made in code | 32³ lookup table, about 10 KB |
| Tree silhouettes | generate: "eucalyptus and acacia tree silhouettes against a flat light background"; key out | 1024 × 512 atlas with transparency |
| Emblem, icons, ornaments | drawn by hand as SVG | inline SVG |
| No-WebGL still | a render of the finished home scene | WebP, about 60 KB |

Everything else is built in code: the stars, moon, flame, embers, smoke, grass blades, every 3D shape and all sound.

### Budget (compressed first load)

| Part | Estimate |
|---|---|
| Code today (game, three.js, react-three-fiber, drei) | 365 KB |
| New code (post-processing, scene, interface) | about 80 KB |
| Fonts: Cinzel, EB Garamond and Noto Serif Ethiopic, subset to the characters actually used (Noto Sans Ethiopic is removed) | about 200 KB |
| Textures (table above, WebP) | about 1,100 KB |
| Icons, images and the rest | about 60 KB |
| **Total** | **about 1.8 MB of the 3 MB budget** |

`npm run check:size` must stay green. If textures run over, they drop from 1024 to 768 before anything else is cut.

### Sound

All sound is synthesized with Web Audio, like the stone sounds today. Nothing is downloaded.
- **Fire crackle:** filtered noise bursts.
- **Wind:** a soft breeze.
- **Crickets:** sparse chirps.
- **Mix:** the ambience drops while stones move.
- **Coin:** a whoosh and a metallic ring.
- **Buttons:** a soft wooden tick.
- **Control:** everything follows the Sound setting.

## 11. Performance tiers

**Choosing a tier:**
- The game starts on the mid tier.
- During the first 3 s of the home screen it measures the median frame rate:
  - below 28: down a tier, and measure again
  - above 55: up a tier, and measure again
- It remembers the result.
- The existing `PerformanceMonitor` keeps watching during play and can step down, but never up, mid-game.

**The minimal tier is planned in from the start, not bolted on later:**
- no post-processing at all
- tone mapping by the renderer, with the colour grade folded into the materials
- the board's shadow on the mat baked into a texture instead of drawn every frame

**Acceptance:** the device is the owner's own Android phone, as in the prototype's phone playtest. If even the minimal tier misses 30 fps there, the next cuts are, in order: pixel density 0.75, the flame drawn as a single billboard, and no hut light.

| | High | Mid | Low | Minimal |
|---|---|---|---|---|
| Pixel density | up to 2 | 1.5 | 1 | 0.85 |
| Fire shadows | 1024 map | 1024 map | 512 map | baked, no flicker |
| Post-processing | full, with depth of field and SMAA | full, no depth of field or SMAA | half-resolution bloom, grain, vignette, grade | none (grade in the materials) |
| Grass blades | 3000 | 1500 | none | none |
| Embers / smoke | 160 / 14 | 90 / 10 | 40 / 6 | 24 / 4 |
| Head and horn triangles | full | full | half | half |
| Draw calls (target) | ≤ 120 | ≤ 100 | ≤ 80 | ≤ 60 |

## 12. How we'll know it's right

1. **Layout:**
   - Screenshots of every screen at 844 × 390 and at 1920 × 1080, set side by side with `renders/`.
   - The owner judges them.
   - Positions should match the mockups to within a few pixels.
2. **Look:**
   - The play view and the home screen, judged against the key art.
   - Do the firelight, shadows and mood come across?
3. **Speed:**
   - At least 30 fps on the owner's Android phone in Chrome, and 60 on a desktop.
   - The `?fps` counter is there for checking.
4. **Size:** `check:size` is under 3 MB.
5. **Tests:**
   - Unit tests for the new geometry: cup centres match the game layout, and count-disc anchors are right.
   - Unit tests for the tier rules.
   - The end-to-end tests run at three landscape sizes: 844 × 390 (full height), 750 × 300 (a phone browser with toolbars, compact layout) and 1280 × 720.
   - A new end-to-end test: a portrait viewport shows "turn your phone".
   - Every existing test still passes.

## 13. The designer's calls (for the owner to check)

1. **Interface language:**
   - Antique Aksumite gold with ember for the active player.
   - Player A is firelight; player B is moonlight.
   - Cinzel, EB Garamond and Noto Serif Ethiopic.
2. **The world is life-size around the real 60 cm board.** The fire burns about 1 m beyond store B's end, and the hut stands 7.5 m beyond store A's end.
3. **The fire and the hut are off-screen during play.** They're felt through light, shadows, embers and smoke, and seen in full on the home screen and during camera moves.
4. **Props, all around the fire:** a coffee corner (jebena, brazier and cups), a stool with a folded gabi on it, and a basket. The play frame holds only the board on its mat.
5. **A warm fill light,** so the board's top reads warmly the way the key art shows, which a fire this low couldn't do alone.
6. **Phone browsers:** a compact layout down to 300 px tall. Full screen on Android from the first tap on Play; landscape and full screen for the installed app.
7. **A minimal performance tier** with no post-processing, planned from the start.
8. **The home camera sweeps an arc** that keeps the fire in view, rather than circling the set.
9. **Captured stones go into the store cups,** and homes are read from the player plates.
10. **The toss coin carries words only:** አንበሳ and ሰው, no lion image.
11. **Count discs** sit just outside each row, rather than over the cups.
12. **WebP textures,** not compressed GPU textures. Simpler and smaller code; revisit if memory becomes a problem.
13. **No music,** only synthesized ambience and effects.
14. **A loading screen with the fire flaring,** and a "turn your phone" screen.

## 14. Left to the builder

- Exact light intensities, flicker feel, shader details and particle tuning, matched to the key art by eye.
- How the head mesh is made: at start-up in a worker, or ahead of time (section 6 limits).
- Code structure: components, hooks, how tiers are wired in.
- The exact colour-grade curve, within the "teal shadows, amber highlights" direction.
- Small layout adjustments for very wide or very tall screens, keeping the anchoring rules.
