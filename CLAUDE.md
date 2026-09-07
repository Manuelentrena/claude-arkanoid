# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid/Breakout clone built with plain HTML, CSS, and JS. No dependencies, no build tools, no package manager, no test framework. Specs 01 through 04 are all in state `Implementado`: paddle, ball with variable bounce angle, a 48-block grid (6 rows x 8 columns) with progressive damage and explosion animation, scoring, lives, Game Over/Victory screens with restart (spec 01); a 576x640 vertical canvas with a separate HUD strip and an unbreakable stone border on three sides (spec 02); one-hit-per-contact block collisions with positional separation and a `deltaTime` cap (spec 03); and sound effects with a HUD mute button (spec 04). Still deliberately deferred to future specs: background music (`assets/sounds/music.mp3`), high-score persistence, power-ups, multiple levels, pause.

The game starts in a `'ready'` state showing a start screen. That is not cosmetic: browsers block audio until the user interacts with the page, so the first Enter or click is what unlocks playback (spec 04). It only appears on page load — restarting after Game Over or Victory goes straight to `'playing'`.

## Running the game

There is no build step. Serve the directory with any static server (e.g. `python3 -m http.server`) and open `index.html` — needed because the spritesheet loader (`assets/spritesheet.js`) draws an `Image` onto a canvas, which some browsers restrict under the `file://` origin.

## Code layout

Plain global-scope scripts loaded via `<script>` tags in `index.html`, in this order: `assets/spritesheet.js`, `sound.js`, `paddle.js`, `ball.js`, `blocks.js`, `border.js`, `collisions.js`, `game.js`, `main.js`. No modules, no bundler — each file owns its own top-level state (`paddle`, `ball`, `blocks`, `score`, `lives`, `status`, etc.) as global variables/objects. `main.js` runs the `requestAnimationFrame` loop and calls `updateGame`/render functions from the other files in order.

`sound.js` is the only file that creates `Audio` objects. It exposes `playSound(name)`, `stopSound(name)`, `toggleSound()` and `isSoundEnabled()` over the `SOUND_DEFS` map (`intro`, `gameover`, `bounce`, `break`), each backed by a pool of `Audio` elements walked round-robin so consecutive hits of the same effect don't cut each other. `soundEnabled` is the single source of truth for muting and is persisted in `localStorage` under `arkanoid.soundEnabled`. Every `play()` carries an empty `.catch()` and every `localStorage` access is wrapped in `try/catch`, so a failing mp3 or private-mode browsing never breaks the game loop. Callers just call `playSound`; they never check the mute flag themselves.

Sound triggers live where the event happens: `startGame()` in `game.js` (intro, the single transition point into `'playing'` — `resetGame()` ends by calling it), the paddle-bounce branch of `updateBall` in `ball.js`, the `MAX_HITS` branch of `updateCollisions` in `collisions.js`, and the `lives <= 0` branch of `updateGame`. Victory is silent on purpose — there is no asset for it.

The HUD audio button is drawn inside the canvas by `drawSoundButton` in `game.js` and hit-tested against `SOUND_BUTTON` in the canvas click listener. That hit-test must stay **before** the start/restart logic, otherwise muting from the Game Over screen would also restart the game.

## Assets

- `assets/spritesheet-breakout.png` — single spritesheet image for all game sprites (paddle, ball, blocks, damage/explosion animations).
- `assets/spritesheet.js` — sprite atlas + loader. Exposes `loadSpritesheet(cb)` (loads the PNG onto an offscreen canvas, calls back once ready — safe to call multiple times), `drawSprite(ctx, name, x, y, w, h)` (draws by name, e.g. `'paddle'`, `'ball'`, or `block_<color>` mapping into `SPRITES.blocks[color]`), and `drawFrame(ctx, frame, x, y, w, h)` (draws a raw `{sx, sy, sw, sh}` frame object, used for damage/explosion frames). Internal color keys are `gray, red, yellow, cyan, magenta, hotpink, green` — note these keys do **not** match the visual color shown on screen (the mapping is documented in a comment at the top of the file); `gray` is not part of the MVP's playable block layout. Each color row has `HIT_FRAMES[color]` (5 progressive damage frames, used as a block takes hits up to `MAX_HITS`) and `EXPLOSION_FRAMES[color]` (5 destruction frames played over `EXPLOSION_DURATION`, 150ms total). `getBlockHitFrame(color, hits)` returns the right frame for a block's current hit count.
- `assets/sounds/` — `intro.mp3`, `ball-bounce.mp3`, `break-sound.mp3` and `game-over.mp3`, all wired up through `sound.js` (spec 04). `music.mp3` is present but deliberately unused; background music is reserved for a future spec and should plug into the same `soundEnabled` switch when it lands.

## Spec-driven workflow

This repo uses a spec-driven development workflow via two custom skills (`spec`, `spec-impl`, defined in `.claude/skills/` and `.agents/skills/`, sourced from `Klerith/fernando-skills` and pinned in `skills-lock.json`). Features are not implemented ad hoc — they go through:

1. `/spec <description>` — clarifies requirements through Q&A, then writes `specs/NN-slug.md` in `Draft` state. Never writes code.
2. A human reviews the spec and manually flips its state to `Approved`.
3. `/spec-impl <NN-slug>` — refuses to proceed unless the spec's state means "Approved". Creates/switches to a git branch `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`, default `true`), then implements the plan one step at a time, pausing for diff review after each step. Never commits automatically.

Four specs are complete, and later ones amend earlier ones — read them in order, newest wins on any conflict. `specs/01-mvp-arkanoid.md` holds the base constants and formulas (paddle/ball physics, hit/explosion frame timing). `specs/02-pala-roja-canvas-vertical.md` replaces the canvas and layout coordinates. `specs/03-colisiones-bloque-robustas.md` supersedes spec 02's block-grid table (the grid is `BLOCK_GAP = 4`, starting at `x:82, y:112`) and defines the collision contract. `specs/04-sonido-y-boton-de-audio.md` adds the audio layer and the `'ready'` state. `specs/.spec-config.yml` holds `AutoCreateBranch: true`. This project is a git repository with a GitHub remote (`origin`); `main` is the default branch.

Note the state wording in this repo is not uniform (`Implementado`, `Aprovado`, `Aceptado` have all been used). `/spec-impl` only proceeds when the state means "approved" in some language.

When asked to build game features in this repo, prefer routing through `/spec` rather than writing code directly, unless the user explicitly asks for a quick/direct change.
