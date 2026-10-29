# Walia ibex Gebeta board: image brief

Every image needed to build the 3D board, in the order to make them, with the prompt for each and a
checklist for whether the result can be used. Written for Gemini; it works best because it can take
your earlier images as input and keep the design consistent.

**14 images are required. 6 more are optional.**

| # | Image | Needed? | Aspect | Attach before prompting | Used for |
|---|---|---|---|---|---|
| 01 | Master design, three-quarter view | required | 16:9 | – | The approved look everything else must match |
| 02 | Board, top view | required | 16:9 | 01 | Outline of the board; cup and store positions |
| 03 | Board, front view (long side) | required | 16:9 | 01 | Thickness, feet, band height, head heights |
| 04 | Board, end view (short end) | required | 4:3 | 01 | Width, cross-section shape of the board |
| 05 | Board, bottom view | optional | 16:9 | 01 | Where the feet sit |
| 06 | Board, cut through one row of cups | optional | 16:9 | 01 | Cup and store depth |
| 07 | Ibex head, side profile | required | 1:1 | 01 | Main outline of the head, neck and horns |
| 08 | Ibex head, front view | required | 1:1 | 01, 07 | Width of the face; how far the horns spread |
| 09 | Ibex head, top view | required | 1:1 | 01, 07 | Curve of the horns seen from above |
| 10 | Ibex head, back view | optional | 1:1 | 01, 07 | How the horns end behind the head |
| 11 | Ibex head, three-quarter view | required | 1:1 | 01, 07 | Overall sculpting of the face and neck |
| 12 | One horn, close-up side view | required | 1:1 | 07 | Number, spacing and shape of the ridges |
| 13 | Ibex side silhouette | required | 1:1 | 07 | Clean outline to trace |
| 14 | Ibex front silhouette | required | 1:1 | 08 | Clean outline to trace |
| 15 | Carved side band, flat colour view | required | 16:9 | 01 | The ornament as it looks |
| 16 | Carved side band, height map | required | 16:9 | 15 | Bump map so the carving catches light |
| 17 | Wood texture | required | 1:1 | 01 | Surface colour and grain of the whole board |
| 18 | End-grain wood texture | optional | 1:1 | 17 | The cut faces at the board's ends |
| 19 | Pebbles | optional | 1:1 | – | Colours and shapes for the 48 stones |
| 20 | Ground the board rests on | optional | 1:1 | – | The surface under the board in the scene |

Save them as `docs/design/board/images/01-master.png`, `02-top.png`, and so on, using the numbers above.

---

## How to get accurate images

1. **Make 01 first and do not move on until it passes its checklist.** Every other image copies it.
2. **Attach the images listed in the table** before each prompt and keep the words "the attached ... as
   the exact design". This is what keeps the views consistent with each other.
3. **One image per message.** Larger images are better: use the highest resolution Gemini offers.
4. **Fix mistakes by editing instead of starting again.** Reply with what is wrong and ask to keep the rest:
   - "There must be exactly six small cups in each row. Redraw with six per row and keep everything else identical."
   - "The horns must sweep backward in one smooth arc, not twist. Keep everything else identical."
   - "Remove the stones / the text / the watermark. Keep everything else identical."
   - "Remove every cross and religious symbol; use only the geometric pattern. Keep everything else identical."
5. **Views must be orthographic** (02–10, 12–14): straight on, no perspective. If a view looks like a
   photo taken from a slight angle, reply: "Make it a true orthographic view, as if the camera were
   infinitely far away."

### Design decisions already in the prompts

Change these before you start if you want them different; every prompt below uses them.

- **Wood:** wanza (*Cordia africana*), the traditional Ethiopian carving wood. It's a warm medium brown with a satin oil finish.
- **Heads face each other** along the length of the board, like two guardians watching the game.
- **Size:**
  - board 56 cm long, 15 cm wide, 3.5 cm thick, on four short square feet
  - cups 5 cm across; stores 8.5 cm across
  - each head rises about 16 cm above the board
- **Ornament:** one narrow carved band of historic Ethiopian geometric patterns on both long sides:
  - stepped diamonds and zigzag chevrons from *tilet*, the woven borders of Ethiopian cloth
  - edged above and below with the stacked window-and-beam pattern carved on the ancient Aksum stelae

  No crosses and no religious symbols. The top surface stays smooth, so the cups stay easy to read in the game.

---

## The images

### 01 · Master design (required, 16:9)

Generate this until it passes the checklist. Two or three tries is normal.

```
A studio product photograph of an original hand-carved Ethiopian Gebeta board (the Ethiopian mancala game), carved from a single block of wanza wood (Cordia africana): warm medium brown, soft satin oil finish, visible straight grain.

Shape: a long, low, flat-topped board shaped like a capsule (a rectangle with fully rounded short ends), about 56 cm long, 15 cm wide and 3.5 cm thick, standing on four short square feet.

Cups: carved into the flat top are exactly twelve identical round hemispherical cups, each about 5 cm across, arranged in two straight parallel rows of six cups, evenly spaced, the two rows close together along the middle of the board. At each short end, on the centre line of the board, is one larger round store cup about 8.5 cm across. That is 6 + 6 small cups and 2 large cups: 14 cups in total.

Walia ibex: at each end, just beyond the store cup, rises the carved head and neck of a Walia ibex (Capra walie), the wild ibex of Ethiopia's Simien Mountains, about 16 cm tall. The two heads face each other along the length of the board. Each has a pair of massive horns, very thick at the base and close together, sweeping backward over the neck in one large smooth semicircular arc and tapering to a point, with bold knobbly ridges across the front edge of each horn; a short chin beard; small ears; a calm, noble face. It is not a goat, an antelope or a deer: the horns arc backward and do not twist or spiral.

Ornament: one narrow band, about 1.5 cm high, of shallow carved historic Ethiopian geometric pattern runs along both long sides of the board: stepped diamonds and zigzag chevrons as in tilet, the woven borders of Ethiopian cloth, edged above and below with the stacked window-and-beam pattern of the ancient Aksum stelae. No crosses and no religious symbols anywhere. Everything else is smooth.

Photography: three-quarter view from the front-left and slightly above, the whole board in frame with space around it, soft warm studio light, plain warm beige background, sharp focus. No stones in the cups. No text, no watermark, no logo.
```

Check before moving on:
- [ ] Exactly **6 + 6** small cups in two straight rows, all the same size
- [ ] Exactly **2** larger store cups, one at each end, on the centre line
- [ ] Horns: thick at the base, **one backward arc**, ridges across the front, no twist
- [ ] A chin beard; it reads as an ibex, not a goat or antelope
- [ ] The two heads face each other
- [ ] The carved band runs along the long side, and the top is smooth
- [ ] Four feet; no stones, text or watermark

---

### Board views (attach 01)

Add this paragraph to the end of every prompt from 02 to 06:

```
Orthographic view: no perspective, as if the camera were infinitely far away. The object is centred and fills about 80% of the frame, with nothing cropped. Flat, even, shadowless lighting on a plain white background. No text, no labels, no dimension lines, no stones.
```

**02 · Top view (required, 16:9)**
```
Using the attached Gebeta board as the exact design, show the same board seen from directly above, looking straight down at the top surface. The two straight rows of six cups and the two larger store cups at the ends are clearly visible as circles; both Walia ibex heads are seen from above, with their horns arcing back over their necks.
```
Check: 12 small circles in two straight rows plus 2 larger ones; left and right halves mirror each other.

**03 · Front view (required, 16:9)**
```
Using the attached Gebeta board as the exact design, show the same board seen straight on from one long side, with the camera level with the board. Both Walia ibex heads appear in exact side profile facing each other, the carved band runs the full length of the side, and all feet on this side are visible.
```
Check: the board's thickness, the band and the feet are visible; both heads are seen exactly from the side.

**04 · End view (required, 4:3)**
```
Using the attached Gebeta board as the exact design, show the same board seen straight on from one short end, looking along its length. The nearer Walia ibex head is seen from directly behind; the board's rounded end, its thickness and the two feet at this end are visible.
```
Check: you can see the board's full width and how the top meets the sides.

**05 · Bottom view (optional, 16:9)**
```
Using the attached Gebeta board as the exact design, show the same board seen from directly below, so the underside and the positions of the four feet are clear.
```

**06 · Cut through one row of cups (optional, 16:9)**
```
Using the attached Gebeta board as the exact design, show a cross-section of the same board cut lengthwise through the centre of one row of cups, seen straight on: the depth and rounded shape of the six cups and of the two end store cups are clear, and the cut wood surface is lighter than the outside.
```

---

### Walia ibex head (attach 01; from 08 on, also attach the approved 07)

Add this paragraph to the end of every prompt from 07 to 12:

```
The head and neck stand alone, ending in a flat cut at the base where they join the board. Same wanza wood and carving style as the attached image. Orthographic view, no perspective, centred, filling about 80% of the frame, nothing cropped, flat even lighting, plain light grey background. No text, no labels.
```

**07 · Side profile (required, 1:1)**
```
Using the attached Gebeta board, isolate one of its carved Walia ibex heads with its neck, exactly the same sculpture, and show it in pure side profile facing left.
```
Check: one backward horn arc with clear ridges, the beard, the ear, and a flat base. Fix 07 before making 08–14, because they all copy it.

**08 · Front view (required, 1:1)**
```
Using the attached Walia ibex sculpture as the exact design, show the same head and neck seen straight from the front, looking directly at its face, so the width of the face and the spread of the two horns are clear.
```

**09 · Top view (required, 1:1)**
```
Using the attached Walia ibex sculpture as the exact design, show the same head and neck seen from directly above, so the curve of both horns, the gap between them and the top of the head are clear.
```

**10 · Back view (optional, 1:1)**
```
Using the attached Walia ibex sculpture as the exact design, show the same head and neck seen straight from behind.
```

**11 · Three-quarter view (required, 1:1)**
```
Using the attached Walia ibex sculpture as the exact design, show the same head and neck from the front-left at 45 degrees, slightly above eye level, lit by a soft light from the upper left so the carved forms of the face and neck read clearly. (For this view only, a gentle shadow is fine.)
```

**12 · One horn, close up (required, 1:1)**
```
Using the attached Walia ibex sculpture as the exact design, show a close-up side view of one horn only, from its base on the head to its tip, filling the frame, so every ridge on the front edge is clearly visible and can be counted.
```
Check: the ridges are easy to count, and their spacing gets tighter towards the tip.

**13 · Side silhouette (required, 1:1). Attach 07**
```
Turn the attached Walia ibex side view into a solid black silhouette on a pure white background: exactly the same outline and size, no inner detail, no shading, no gradient, crisp edges, nothing else in the image.
```

**14 · Front silhouette (required, 1:1). Attach 08**
```
Turn the attached Walia ibex front view into a solid black silhouette on a pure white background: exactly the same outline and size, no inner detail, no shading, no gradient, crisp edges, nothing else in the image.
```
Check for 13 and 14: lay each over the image it came from. The outlines must match.

---

### Carved band (attach 01, then 15)

**15 · Band, flat colour view (required, 16:9)**
```
Using the attached Gebeta board as the exact design, show only the carved ornament band from its long side, as a straight horizontal strip seen perfectly flat and straight on, filling the width of the frame, with at least two full repeats of the pattern: stepped diamonds and zigzag chevrons as in Ethiopian tilet woven borders, edged above and below with the stacked window-and-beam pattern of the Aksum stelae, carved as shallow relief in the same wanza wood. No crosses and no religious symbols. Flat even lighting, no perspective, no text.
```

**16 · Band height map (required, 16:9)**

No longer needed: `blueprint/band-height-tile.svg` is an exact, seamless height map drawn from the blueprint.
```
Convert the attached carved band into a grayscale height map for 3D work: pure white is the highest raised surface, pure black is the deepest cut, smooth greys in between. No lighting, no shadows, no highlights, no wood grain, no colour. Keep exactly the same pattern, size and position. The left and right edges must join seamlessly when the image is tiled side by side.
```
Check: the diamonds, chevrons and stelae bands are white (raised); there's no shading as if lit from one side; the left and right edges match.

---

### Materials

Add this paragraph to the end of 17 and 18:

```
Seen perfectly flat from directly above. Completely even lighting: no shadows, no reflections, no vignette. Seamless: the left edge joins the right edge and the top joins the bottom when tiled. One continuous surface with no seams, joints, planks or tiles. No text.
```

**17 · Wood texture (required, 1:1). Attach 01**
```
A seamless texture of the same wanza wood as the attached board: warm medium brown, straight fine grain running from left to right, satin oiled finish, no knots.
```
Check: it looks like the board's wood, it has no tiles, planks or dark stripes, and it repeats without a visible edge.

**18 · End-grain texture (optional, 1:1). Attach 17**
```
A seamless texture of the cut end of the same wanza wood as the attached texture, showing fine growth rings and pores, same colour.
```

**19 · Pebbles (optional, 1:1)**
```
Top-down photograph of twelve small natural river pebbles of the kind children collect to play Gebeta, laid apart on a pure white background with space between them: smooth, slightly flattened, irregular shapes, in natural greys, browns and a few cream and pale stones. Even soft light, no text.
```

**20 · Ground under the board (optional, 1:1)**
```
A seamless texture of dry, packed red-brown Ethiopian earth as found in a village courtyard, with fine grit and a few tiny pebbles, seen perfectly flat from directly above, completely even lighting, no shadows, no footprints, no objects, no text. The left edge joins the right edge and the top joins the bottom when tiled.
```

---

## After the images

Send the folder when 01–17 are done (plus any optional ones you made). Image models get proportions
right but not exact measurements, so the next step is a dimensioned blueprint drawn from these images
and the game's own layout. The 3D board is built from that blueprint, with these images as the visual
reference and the source of the textures.
