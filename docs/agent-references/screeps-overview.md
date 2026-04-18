# Screeps Overview (curated)

Sources: [Screeps docs index](https://docs.screeps.com/index.html), [Introduction (gameplay)](https://docs.screeps.com/introduction.html)

This is a **project-oriented** overview of Screeps concepts that come up frequently while evolving this codebase.

## Gameplay fundamentals (when to read official Gameplay docs)

Use [Introduction](https://docs.screeps.com/introduction.html) and the rest of the **Gameplay** section when assumptions involve **world rules**, not just API calls — e.g. expansion, room layout, economy cadence, combat terrain.

High level (from Introduction):

- **Persistent shared world:** colonies exist in one continuous world; rooms are **50×50** cells with **1–4** exits; **shards** add a vertical axis (inter-shard portals).
- **Terrain:** plains (move cost 2), swamps (10), walls (block). **Roads** cost 1 and decay; **ramparts** / **constructed walls** are player defenses (ramparts protect occupants until destroyed).
- **Energy:** **sources** are the main early resource; they **regenerate** on a fixed tick cadence (official: every **300** ticks). Plan harvesters and room cache around that.
- **Spawns:** up to **3** spawns per room; extensions unlock larger bodies. Spawn placement and body design are gameplay + management concerns.

Scripting fundamentals (ticks, intents, CPU) are summarized in `screeps-api.md` and linked from [Game loop](https://docs.screeps.com/game-loop.html), [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html), [Global objects](https://docs.screeps.com/global-objects.html), [CPU limit](https://docs.screeps.com/cpu-limit.html), and [Debugging](https://docs.screeps.com/debugging.html).

## Core mental model

- **One tick = one execution of your main loop.**
- You issue **intents** (actions like `harvest`, `transfer`, `build`) each tick; world updates for those intents apply at tick boundaries (see `screeps-api.md` and [Game loop](https://docs.screeps.com/game-loop.html)).
- State persists via **Memory**, but game objects may appear/disappear over time.

## Where logic belongs (repo structure)

- `src/roles/`
  - Per-creep decision making for a single tick.
  - Typically a small state machine driven by `CreepMemory` (e.g. `working: boolean`).

- `src/management/`
  - Room/spawn orchestration (population targets, spawn queue, room-level caching).
  - Prefer “one room pass” that computes reusable info once per tick.

## CPU + performance basics

- **`room.find(...)` and broad scans are expensive** in hot paths.
- Prefer caching and soft references:
  - Store **IDs** in memory where it reduces repeated searches.
  - Resolve with `Game.getObjectById(...)` and always handle `null`.
- For **burst CPU** (`Game.cpu.bucket` / `Game.cpu.tickLimit`), see `screeps-api.md` and [CPU limit](https://docs.screeps.com/cpu-limit.html).

## Memory basics (project expectations)

- Memory is a JSON-like object available as `Memory`.
- This repo prefers **typed memory interfaces** (extend `CreepMemory`, `RoomMemory`, etc.).
- Memory fields should be **intentional contracts**, not `any`.
- Never persist live `Game` objects — only IDs and JSON-safe values ([Global objects](https://docs.screeps.com/global-objects.html)).

## Practical “gotchas”

- Objects can disappear (structures destroyed, creeps die), so stored IDs can become invalid.
- Pathing and target selection can easily become CPU-heavy: centralize reuse where possible.
- Multi-action creeps: same-tick **pipeline** conflicts can drop intents — see **Action priority matrix** in `screeps-api.md` and [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html).
