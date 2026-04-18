# Agent References (Screeps AI v03)

This folder is the **shared reference library** and the **source of truth** for Screeps **runtime behavior** (ticks, intents, simultaneous actions, `Game`/`Memory`, CPU bucket, debugging expectations) as curated for this repo.

- **Repo rules live elsewhere**: follow the various `AGENTS.md` files for repo-specific conventions.
- **These docs are supporting material**: use them when you need Screeps gameplay/API detail or project patterns.
- **Workflow lives in skills**: use `.agents/skills/` for process checklists; use this folder for Screeps facts and behavior references.

## Canonical Screeps documentation

- Overview / navigation: `https://docs.screeps.com/index.html`
- API reference: `https://docs.screeps.com/api/`
- **Scripting fundamentals:** [Game loop](https://docs.screeps.com/game-loop.html) · [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html) · [Global objects](https://docs.screeps.com/global-objects.html) · [Debugging](https://docs.screeps.com/debugging.html) · [CPU limit](https://docs.screeps.com/cpu-limit.html)
- **Gameplay (world rules):** start with [Introduction](https://docs.screeps.com/introduction.html), then other Gameplay articles as needed (creeps, resources, defense, etc.).

## What to read (quick index)

- `screeps-overview.md`
  - Core concepts, **gameplay** assumptions (rooms, sources, spawns), and _where_ to put logic (role vs management vs main loop).
  - When changing **strategy** (expansion, economy cadence, room topology).

- `screeps-api.md`
  - **Action priority matrix**, intent timing, `Game`/`Memory`, CPU bucket, return codes, `Room.find`, `Game.getObjectById`.
  - When changing **creep actions**, FSM transitions tied to stores, or **same-tick** multi-intent behavior.

- `external-example-codebases.md`
  - When you want **optional pointers** to other open-source Screeps AIs (bonzAI, Overmind, Nooby Guide) for patterns and vocabulary — not mirrored here; adapt to this repo’s standards.

## How we use references in this repo

- Prefer **IDs in memory** + `Game.getObjectById(...)` over repeated searches in hot loops.
- Treat stored IDs as **soft references**: null-check results (objects disappear).
- Keep references **curated**: add short project notes and links, not huge raw dumps.
- **Routing rule:** scripting semantics → `screeps-api.md` + official Scripting links above; world/economy/defense rules → `screeps-overview.md` + official **Gameplay** docs (e.g. Introduction).
