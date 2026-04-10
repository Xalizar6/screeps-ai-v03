# Screeps Overview (curated)

Source: `https://docs.screeps.com/index.html`

This is a **project-oriented** overview of Screeps concepts that come up frequently while evolving this codebase.

## Core mental model

- **One tick = one execution of your main loop.**
- You issue **intents** (actions like `harvest`, `transfer`, `build`) each tick.
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

## Memory basics (project expectations)

- Memory is a JSON-like object available as `Memory`.
- This repo prefers **typed memory interfaces** (extend `CreepMemory`, `RoomMemory`, etc.).
- Memory fields should be **intentional contracts**, not `any`.

## Practical “gotchas”

- Objects can disappear (structures destroyed, creeps die), so stored IDs can become invalid.
- Pathing and target selection can easily become CPU-heavy: centralize reuse where possible.
