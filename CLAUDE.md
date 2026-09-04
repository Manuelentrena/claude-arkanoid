# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid/Breakout clone built with plain HTML, CSS, and JS. No dependencies, no build tools, no package manager, no test framework. The MVP (`specs/01-mvp-arkanoid.md`, state `Implementado`) is built: paddle, ball with variable bounce angle, a 48-block grid (6 rows x 8 columns) with progressive damage and explosion animation, scoring, lives, and Game Over/Victory screens with restart. Sound effects and score persistence are not wired up yet — see the spec's "fuera de alcance" section for what's deliberately deferred to future specs.

## Running the game

There is no build step. Serve the directory with any static server (e.g. `python3 -m http.server`) and open `index.html` — needed because the spritesheet loader (`assets/spritesheet.js`) draws an `Image` onto a canvas, which some browsers restrict under the `file://` origin.

## Code layout

Plain global-scope scripts loaded via `<script>` tags in `index.html`, in this order: `assets/spritesheet.js`, `paddle.js`, `ball.js`, `blocks.js`, `collisions.js`, `game.js`, `main.js`. No modules, no bundler — each file owns its own top-level state (`paddle`, `ball`, `blocks`, `score`, `lives`, `status`, etc.) as global variables/objects. `main.js` runs the `requestAnimationFrame` loop and calls `updateGame`/render functions from the other files in order.

## Assets

- `assets/spritesheet-breakout.png` — single spritesheet image for all game sprites (paddle, ball, blocks, damage/explosion animations).
- `assets/spritesheet.js` — sprite atlas + loader. Exposes `loadSpritesheet(cb)` (loads the PNG onto an offscreen canvas, calls back once ready — safe to call multiple times), `drawSprite(ctx, name, x, y, w, h)` (draws by name, e.g. `'paddle'`, `'ball'`, or `block_<color>` mapping into `SPRITES.blocks[color]`), and `drawFrame(ctx, frame, x, y, w, h)` (draws a raw `{sx, sy, sw, sh}` frame object, used for damage/explosion frames). Internal color keys are `gray, red, yellow, cyan, magenta, hotpink, green` — note these keys do **not** match the visual color shown on screen (the mapping is documented in a comment at the top of the file); `gray` is not part of the MVP's playable block layout. Each color row has `HIT_FRAMES[color]` (5 progressive damage frames, used as a block takes hits up to `MAX_HITS`) and `EXPLOSION_FRAMES[color]` (5 destruction frames played over `EXPLOSION_DURATION`, 150ms total). `getBlockHitFrame(color, hits)` returns the right frame for a block's current hit count.
- `assets/sounds/` — `ball-bounce.mp3` and `break-sound.mp3`. Not integrated into the MVP; deferred to a future spec.

## Spec-driven workflow

This repo uses a spec-driven development workflow via two custom skills (`spec`, `spec-impl`, defined in `.claude/skills/` and `.agents/skills/`, sourced from `Klerith/fernando-skills` and pinned in `skills-lock.json`). Features are not implemented ad hoc — they go through:

1. `/spec <description>` — clarifies requirements through Q&A, then writes `specs/NN-slug.md` in `Draft` state. Never writes code.
2. A human reviews the spec and manually flips its state to `Approved`.
3. `/spec-impl <NN-slug>` — refuses to proceed unless the spec's state means "Approved". Creates/switches to a git branch `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`, default `true`), then implements the plan one step at a time, pausing for diff review after each step. Never commits automatically.

`specs/01-mvp-arkanoid.md` (state `Implementado`) is the first completed spec — read it for the exact constants/coordinates/formulas the current implementation follows (paddle/ball physics, block grid layout, hit/explosion frame timing, etc). `specs/.spec-config.yml` holds `AutoCreateBranch: true`. This project is now a git repository with a GitHub remote (`origin`), on branch `main`.

When asked to build game features in this repo, prefer routing through `/spec` rather than writing code directly, unless the user explicitly asks for a quick/direct change.
