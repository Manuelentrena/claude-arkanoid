# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid/Breakout clone built with plain HTML, CSS, and JS. No dependencies, no build tools, no package manager, no test framework — this is a from-scratch project (the game code itself has not been written yet; only assets and workflow scaffolding exist so far).

## Running the game

There is no build step. Once an `index.html` exists, open it directly in a browser or serve the directory with any static server (e.g. `python3 -m http.server`) — needed because the spritesheet loader (`assets/spritesheet.js`) draws an `Image` onto a canvas, which some browsers restrict under the `file://` origin.

## Assets

- `assets/spritesheet-breakout.png` — single spritesheet image for all game sprites (paddle, ball, blocks, explosion animations).
- `assets/spritesheet.js` — sprite atlas + loader for the spritesheet. Exposes `loadSpritesheet(cb)` (loads the PNG onto an offscreen canvas, calls back once ready — safe to call multiple times) and `drawSprite(ctx, name, x, y, w, h)` for drawing by name. Block sprites are addressed as `block_<color>` (e.g. `block_red`), which map into `SPRITES.blocks[color]`. Colors available: gray, red, yellow, cyan, magenta, hotpink, green. `EXPLOSION_FRAMES[color]` gives a 4-frame animation per color, and `EXPLOSION_DURATION` (150ms) is the intended duration for that animation.
- `assets/sounds/` — `ball-bounce.mp3` and `break-sound.mp3`.

## Spec-driven workflow

This repo uses a spec-driven development workflow via two custom skills (`spec`, `spec-impl`, defined in `.claude/skills/` and `.agents/skills/`, sourced from `Klerith/fernando-skills` and pinned in `skills-lock.json`). Features are not implemented ad hoc — they go through:

1. `/spec <description>` — clarifies requirements through Q&A, then writes `specs/NN-slug.md` in `Draft` state. Never writes code.
2. A human reviews the spec and manually flips its state to `Approved`.
3. `/spec-impl <NN-slug>` — refuses to proceed unless the spec's state means "Approved". Creates/switches to a git branch `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`, default `true`), then implements the plan one step at a time, pausing for diff review after each step. Never commits automatically.

The `specs/` directory does not exist yet — it is created by the first `/spec` invocation. Note this project is **not currently a git repository**, so `/spec-impl`'s branch-creation step will need `git init` first.

When asked to build game features in this repo, prefer routing through `/spec` rather than writing code directly, unless the user explicitly asks for a quick/direct change.
