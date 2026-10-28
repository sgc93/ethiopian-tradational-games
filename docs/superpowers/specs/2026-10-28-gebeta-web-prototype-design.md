# Gebeta 3D Web Prototype — Design

Date: 2026-10-28
Status: approved by the owner, 2026-10-28

## 1. Intent

A free app, for all ages and for people anywhere in the world, whose only goal is to bring Ethiopia's traditional childhood games into digital form and let the world see what an Ethiopian childhood was like. Gebeta is the first game. Later games (Segno Maksegno, Mehareben Yayachihu, Dibibkosh, Kelebosh, Genna) are out of scope for this document.

This prototype has to prove two things:

1. Someone who grew up playing Gebeta plays it and says "that's it" — the rules, the look, the feel.
2. Someone who has never heard of Gebeta can learn it from the app alone and finish a quick game (one round) without help.

### Who it's for

- **Ethiopians, at home and abroad.** They judge authenticity: "is this how we played?"
- **Everyone else.** They need to be taught, quickly and kindly.
- **Many will be on low-end Android phones with expensive mobile data** (Ethiopia), as well as desktop browsers and iPhones elsewhere.

## 2. Goals, non-goals, anti-goals

**Goals (prototype)**

- The full 12-hole Gebeta, in two formats (section 4):
  - **Quick game:** one round; whoever takes more stones wins.
  - **Full match:** up to 5 rounds played for homes.
- Play against the computer at easy, medium and hard.
- Play against a friend on the same device (pass-and-play).
- A 3D board that looks like the childhood version: holes scooped into the earth, small pebbles as seeds.
- Stones visibly sown one by one, with sound.
- Amharic and English.
- A guided first game for newcomers.
- Playable offline after the first visit, and installable from the browser.

**Non-goals (prototype)**

- Accounts, online play, leaderboards.
- Any game other than Gebeta.
- App-store builds (Capacitor comes later; the code must not block it).
- Regional variants: the ጀን (jen) rule, the 18-hole three-row board, the "official" kinchibosh/effisosh levels.

**Anti-goals — failure even if it technically works**

- It looks like a generic mancala app with an Ethiopian flag pasted on.
- The rules make Ethiopians wince.
- Ads, paywalls, locked content or tracking.
- A heavy download that people on Ethiopian mobile data won't wait for.

## 3. Decided by the owner

- **Web first**, built with **React + TypeScript + Vite + React Three Fiber (three.js)**. Later wrapped as a phone app with **Capacitor** from the same code.
- **Look:** the board is the earth (holes in the ground) or a flat stone; the seeds are small collected stones. No carved wooden board.
- **Rules:** section 4, including the resolutions of the points the sources left unclear.
- **How a round ends:** as written in 4.3, the way the sources describe it.
- **How a match ends:** when a player has no homes left, or after 5 rounds, whichever comes first; then whoever owns more homes wins (4.4). The owner chose this after a simulation showed that, with "no homes left" as the only ending, matches between evenly matched players almost never finish.
- **A one-round quick game** alongside the full match.
- **Prototype scope:** as listed in Goals and Non-goals above.
- **Who builds it:** Claude writes the code; the owner plays it in the browser (desktop and their phone) and gives feedback.

## 4. Rules

Sources: Tesfamicael & Farsani, *Creating a Culturally Responsive Mathematics Education: The Case of Gebeta Game in Ethiopia* (IntechOpen; games filmed in Gondar and Addis Ababa), and Oliver Thiel's Gebeta rules (github.com/oliver-thiel/Gebeta-JS), which cite that work. Confirmed by the owner on 2026-10-28.

### 4.1 Board and setup

- Two rows of 6 holes; 48 stones; 4 stones in every hole. A hole holding 4 stones is a **ቤት (bet, "home")**.
- Model the board as a ring of 12 holes numbered 0–11 in sowing order (counter-clockwise seen from above). Player A sits along holes 0–5, player B along holes 6–11. Each player sees their own row running left to right, and sowing always moves to the player's right along their own row.
- **Every hole has an owner.** In the first round A owns 0–5 and B owns 6–11. Ownership changes between rounds (4.5). Every rule below that says "your hole" means a hole you own, not a hole on your physical side.
- Round 1 starts with a coin toss: **አንበሳ (anbesa, lion)** or **ሰው (sew, person)**.

### 4.2 A turn

1. The player picks a hole they own that holds at least one stone, and picks up all its stones.
2. They drop one stone into each following hole in sowing order. The starting hole is **not** skipped when a sowing goes all the way around.
3. After each stone is dropped, look at the count in that hole:
   - **Not the last stone in hand, and the hole now holds exactly 4:** the **owner of that hole** takes the 4 immediately, even though it is not their turn. Sowing continues with the stones still in hand.
   - **Last stone in hand, hole now holds exactly 4:** the **player whose turn it is** takes the 4, wherever the hole is. The turn ends.
   - **Last stone in hand, hole was empty (now holds 1):** the turn ends.
   - **Last stone in hand, any other count:** the player picks up every stone in that hole (including the one just dropped) and keeps sowing from the next hole (back to step 2).

Captured stones leave the board and are kept by the capturer until the round ends.

### 4.3 End of a round

- At the start of a player's turn, if every hole they own is empty, the round ends.
- The other player takes every stone still on the board.
- Each player counts their stones (the two totals always add up to 48). The higher total wins the round. 24–24 is a drawn round (about 13% of rounds in simulation).
- Every capture is exactly 4 stones, and the end-of-round sweep is 48 minus a multiple of 4, so **both totals are always multiples of 4**. There are never leftover stones.

### 4.4 Formats and the end of the match

**Quick game:** one round. The higher total wins; 24–24 is a draw.

**Full match:** rounds are played for homes (4.5) until one of these happens:

1. **A player has no homes left**, which means they took no stones at all in a round. They lose the match immediately.
2. **Round 5 has been played.** Whoever owns more homes wins. Homes are counted from the round just played, so the round-5 winner owns more homes; rounds 1–4 matter because winning them gives you more holes to play from in later rounds.
3. **If round 5 is drawn**, players keep playing single extra rounds until one is not drawn, and the winner of that round wins the match (Claude's call).

The game screen always shows which round it is out of 5.

### 4.5 Setting up the next round (homes change hands)

- Every hole starts the new round with 4 stones again. All 48 stones go back on the board; only ownership changes.
- Each player owns one hole for every 4 stones they won: `total / 4`. The two always add up to 12.
- **Which holes change hands:** each player's holes form one unbroken run around the ring. The round winner keeps their own row and takes the extra holes from the start of the loser's row, continuing in sowing order (if A wins with 7 homes, A owns 0–6 and B owns 7–11; if B wins with 7, B owns 6–11 and 0, and A owns 1–5). In a drawn round, both players go back to their own six holes.
- **Who starts:** the winner of the previous round. After a drawn round, the player who did not start the previous round.

### 4.6 Safety rules the rules engine must enforce

- There are always exactly 48 stones in total: on the board, in hand, or captured.
- **Endless turns are possible, and the rule is that the turn ends** (Claude's call). Relay sowing can circle forever without any capture. Simulation found this about once in 175,000 turns of random play. For example, holes 0–11 with A owning 0–5: board `[2,1,0,2,1,0 | 1,2,0,2,1,0]`, and B sows from hole 7. The engine detects the moment a relay pick-up would start from a board and hole it has already started from in this same turn. At that moment the turn ends and the stones stay where they are. This example is a fixed test case.
- A simulation of many random and greedy matches must run as part of the test suite and report round and match lengths. Every round must end, and every full match must end within the format in 4.4.

## 5. Experience

### 5.1 The board scene

- A patch of red-brown earth with 12 scooped, half-sphere holes in two rows of six.
- 48 small, irregular pebbles in natural colours (greys, browns, a few pale ones). No identical spheres, no glossy plastic.
- Each player's captured stones sit on the ground beside their side of the board, gathered in visible groups of four, so you can count homes at a glance.
- Hole ownership is always visible. When holes change hands between rounds, the change is shown happening, not just applied. Mark ownership with more than colour alone (for example a scratched line or small marker stones in the earth).
- Warm afternoon light, one soft shadow.
- The camera sits at the current player's side at a comfortable angle. Players can drag to tilt or turn it a little, within limits, but never have to touch it to play.

### 5.2 Playing

- Tap one of your holes to sow from it. Holes you can play are highlighted; tapping anything else gives gentle feedback and does nothing.
- Pick-up, each stone's arc into the next hole, relay pick-ups and captures are all animated, with a soft earthy sound for each stone dropped.
- Animation speed: normal, fast, or skip to the result. Normal is the default. Speed is fast when the device asks for reduced motion.
- Stone counts can be shown above each hole. On by default (Claude's call), and can be switched off.
- Against the computer, its moves play out with the same animation, so you can follow what it did.
- In pass-and-play the view turns to face whoever's turn it is, with a setting to keep it fixed (Claude's call).

### 5.3 Screens

- **Home:** play against the computer (easy, medium, hard), play with a friend, learn to play (guided game), about Gebeta, language (አማርኛ / English), sound on/off. Choosing either way of playing then asks: quick game or full match.
- **Game:** the board; whose turn it is; in a full match, the round ("Round 2 of 5"); stones each player has taken this round; homes each player owns; a menu with pause, restart, speed, counts on/off and quit.
- **Round summary (full match):** stones each player won and the homes each will own next round, then the board shows the holes changing hands.
- **Result:** who won (or a draw, in a quick game), the score, how many rounds in a full match, play again.
- **About Gebeta (Claude's call):** one short screen on what Gebeta is and how it's played in Ethiopia.

### 5.4 The guided first game

A real quick game (one round) against a gentle opponent from a prepared opening, in which the learner makes real moves with hints. It teaches, in order:

1. picking up and sowing
2. carrying on from a full hole
3. stopping at an empty hole
4. taking 4 with your last stone
5. the owner taking 4 during someone else's sowing
6. how a round ends

After the round, a short demonstration shows how the result would turn into homes in a full match. The learner can leave at any time.

### 5.5 The computer opponent

- **Easy:** a child or newcomer can beat it. **Hard:** it beats a casual adult player most of the time. **Medium** sits between.
- It must never freeze the screen. Its thinking runs off the main thread and takes no longer than about 1.5 seconds on a low-end phone.
- It plays both formats under the same rules, playing to win the quick game or the whole match.

### 5.6 Language

- All text in Amharic and English. The first visit picks the device language (Amharic if the device is set to it, otherwise English); the player can switch any time.
- Gebeta's own words (ገበጣ, ቤት, አንበሳ / ሰው) appear in Ge'ez script beside the English, even in English mode (Claude's call).
- Ethiopic text uses Noto Sans Ethiopic (SIL Open Font License), bundled with the app so it works offline.

## 6. Constraints

- **Download size:** first load at most about 3 MB compressed, including code, font, sounds and textures.
- **Smoothness:** at least 30 frames per second on a low-end Android phone in Chrome; 60 on mid-range phones and desktops.
- **Browsers:** current Chrome on Android, Safari on iOS, and desktop Chrome, Edge, Firefox and Safari. WebGL 2 is required; if it's missing, show a clear message.
- **Offline:** after the first visit the whole prototype works offline, and can be installed to the home screen.
- **Privacy:** no accounts, no analytics, no tracking. Settings, and a match in progress, are saved on the device only, so closing the tab doesn't lose a game (resuming a match is Claude's call).
- **Licences:** fonts under OFL; textures and sounds are made by us or CC0. Nothing that needs attribution we can't show, nothing copyrighted.
- **Later phone app:** nothing in the web build may rule out wrapping it with Capacitor (no reliance on browser features Capacitor's web views lack).
- **Machine:** Node 26.12, pnpm 10.28 and git 2.45 are installed. The project folder is empty and not yet a git repository.

## 7. How it's built (Claude's calls)

- A **pnpm workspace** with two parts:
  - `packages/gebeta-rules`: pure TypeScript with no React or three.js. It holds the rules, rounds, homes and the computer opponent. Applying a move returns the new state **and a step-by-step list of what happened** (pick up, drop into hole h, capture by player p, relay, turn end). The 3D board replays that list as animation. The computer and the tests run the same rules instantly, without animation.
  - `apps/web`: Vite + React + React Three Fiber (with `@react-three/drei`), GSAP for the stone arcs, i18next for languages, Howler.js for sound, `vite-plugin-pwa` for offline and install.
- The computer opponent runs in a Web Worker.
- **Tests:**
  - Vitest unit tests for every rule in section 4, each written as a small worked example, including the endless-turn example in 4.6.
  - Property tests (fast-check): 48 stones are always conserved, every hole always has exactly one owner, both round totals are multiples of 4, and every turn ends.
  - The simulation from 4.6.
  - Playwright tests that play a quick game and a full match against the easy computer at skip speed.
- **Hosting:** Cloudflare Pages. Development runs locally, and on the home network for phone testing. Putting it on a public URL needs the owner's go-ahead first.
- The project folder becomes a git repository when building starts.

## 8. Left to the builder

- The computer opponent's algorithm, within the strength and time limits in 5.5.
- Exact visuals: textures, colours, pebble shapes, camera angles, UI layout and styling, within section 5.
- Animation timings and sound choices, within the licences in section 6.
- State management and code structure inside each package.
- The prepared opening and hint wording for the guided game.

## 9. Calls Claude made — owner, please check

1. **Which holes change hands (4.5):** the winner takes the holes at the start of the loser's row, continuing on from the winner's own row in sowing direction. The winner's own row is their physical row, rebuilt from scratch each round.
2. **Drawn round (4.3, 4.5):** both players go back to six holes each; the player who didn't start last round starts.
3. **Drawn round 5 (4.4):** extra single rounds until one isn't drawn.
4. **Endless turns (4.6):** the turn ends where the repeat is detected.
5. **Stone counts above holes:** on by default, can be switched off.
6. **Pass-and-play camera:** turns to face the current player, with an option to keep it fixed.
7. **About Gebeta screen** and **Ge'ez-script game terms in English mode.**
8. **Resume a match** after the tab is closed.
9. **Tooling and structure** in section 7.
