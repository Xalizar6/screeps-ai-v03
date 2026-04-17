# Agent References (Screeps AI v03)

This folder is a **shared reference library** for agents working in this repo.

- **Repo rules live elsewhere**: follow the various `AGENTS.md` files for repo-specific conventions.
- **These docs are supporting material**: use them when you need Screeps gameplay/API detail or project patterns.
- **Workflow lives in skills**: use `.agents/skills/` for process checklists; use this folder for Screeps facts and behavior references.

## Canonical Screeps documentation

- Overview / navigation: `https://docs.screeps.com/index.html`
- API reference: `https://docs.screeps.com/api/`

## What to read (quick index)

- `screeps-overview.md`
  - When you need reminders on core concepts (ticks, CPU, memory, rooms, spawns, creeps).
  - When you’re deciding _where_ to put logic (role vs management vs main loop).

- `screeps-api.md`
  - When you need exact API behavior (e.g. `Game.getObjectById`, `Room.find`, `Creep` actions, return codes).
  - When implementing a new behavior and want the correct primitive calls.

- `external-example-codebases.md`
  - When you want **optional pointers** to other open-source Screeps AIs (bonzAI, Overmind, Nooby Guide) for patterns and vocabulary — not mirrored here; adapt to this repo’s standards.

## How we use references in this repo

- Prefer **IDs in memory** + `Game.getObjectById(...)` over repeated searches in hot loops.
- Treat stored IDs as **soft references**: null-check results (objects disappear).
- Keep references **curated**: add short project notes and links, not huge raw dumps.
