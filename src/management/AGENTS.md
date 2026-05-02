# `src/management/` Agent Instructions

These instructions apply when working in `src/management/`.

## Responsibilities

- Management modules coordinate **room/spawn-level decisions** (e.g. population targets, spawn queues, room-wide caching).
- Avoid embedding detailed per-creep behavior here; delegate to role modules in `src/roles/`.
- **Automated layout / construction planning** lives in `construction/`; `roomManager` is the orchestrator that calls into those modules.
- **Room-level persistent cache** (source IDs and nearby container IDs for energy routing) lives in **`roomCache.ts`**; `roomManager` calls it each tick before construction planning. Extend here as you add more room-scoped cached data (minerals, links, etc.).

## Current modules

| File                                | Responsibility                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `roomManager.ts`                    | Per-room orchestrator; calls all sub-managers in order each tick                                             |
| `spawnManager.ts`                   | Census-based spawn queue; decides what and when to spawn                                                     |
| `roomCache.ts`                      | Tick-scoped cache for `room.find(...)` results (sources, containers, sites)                                  |
| `structureCache.ts`                 | Tick-scoped cache for structures by type (spawns, extensions, towers, etc.)                                  |
| `roomConstruction.ts`               | Legacy construction-site placement; exports `CONSTRUCTION_PLAN_INTERVAL`                                     |
| `shuttleDemand.ts`                  | Calculates shuttle population target based on energy demand                                                  |
| `creepSnapshot.ts`                  | Builds a per-room, per-role index of live creeps once per tick                                               |
| `creepMemoryGc.ts`                  | Cleans `Memory.creeps` entries for dead creeps each tick                                                     |
| `tickSignals.ts`                    | Derives cross-module signals (e.g. construction-site counts by room)                                         |
| `repairConfig.ts`                   | Repair thresholds and structure priority rules                                                               |
| `construction/planGenerator.ts`     | Computes spawn↔source↔controller road paths into `RoomLayoutPlan` (sequential PathFinder + CostMatrix merge) |
| `construction/layoutConstructor.ts` | Places construction sites from the approved plan                                                             |
| `construction/layoutVisualizer.ts`  | Renders plan overlays in-game for review                                                                     |

## Execution order (per tick, per room)

`roomManager.runRoomManagement` runs this sequence every tick:

1. **`tickSignals`** — `countMyConstructionSitesByRoom()` (pre-loop, room-agnostic)
2. **`roomCache`** — populates tick-scoped `room.find(...)` results
3. **`structureCache`** — populates tick-scoped structure-by-type results
4. **`planGenerator`** — updates `RoomLayoutPlan` in `RoomMemory` if needed
5. **`layoutVisualizer`** — renders plan overlays (no writes to game state)
6. **`roomConstruction` + `layoutConstructor`** — places construction sites _(gated: only runs every `CONSTRUCTION_PLAN_INTERVAL` = 100 ticks)_

Spawn management runs **after** room management (called from `src/index.ts` using the creep snapshot).

## CPU + data flow expectations

- Prefer a **single room pass** that computes/caches reusable data once, then feeds it into the rest of the tick.
- Be careful with repeated `room.find(...)` calls; cache results for the tick (or store IDs in `RoomMemory` when it makes sense).
- For **bursty** work (heavy pathing, large scans), consider `Game.cpu.bucket` / `Game.cpu.tickLimit` and defer to ticks with headroom — see **CPU limit and bucket** in `docs/agent-references/screeps-api.md` and [CPU limit](https://docs.screeps.com/cpu-limit.html).

## Memory typing

- When adding `RoomMemory` / `SpawnMemory` fields, extend the interfaces in `src/types.d.ts` (or the repo’s memory typing location).
- Treat IDs in memory as soft references: always null-check after `Game.getObjectById(...)`.

## Integration points

- Keep exported APIs small and obvious (e.g. `runRoom(room: Room)` / `runSpawns(room: Room)`), so the main loop can call them predictably.

## JSDoc

- Follow root [`AGENTS.md`](../../AGENTS.md) and **[`docs/agent-references/jsdoc-conventions.md`](../../docs/agent-references/jsdoc-conventions.md)**.
- **Every** module-scope `function` / `const` helper in this folder should have at least a one-line `/** summary */` above it so construction and cache files read clearly when you are learning the flow.

## Logging

- Export `LOG_MODULE` and follow **`src/logging/AGENTS.md`** for `createLogger` / `Memory.log.modules` and shared conventions.
- Prefer **`info` / `stat` / `moduleScope`** at information level; use **`path` / `debugLazy`** for deeper diagnosis. Avoid per-structure spam inside tight `room.find` loops unless gated by verbosity.

## References

When implementing room/spawn orchestration or caching, consult:

- `docs/agent-references/screeps-api.md` (room queries, CPU bucket, soft references via `Game.getObjectById`)
- `docs/agent-references/screeps-overview.md` (CPU + data flow, gameplay assumptions e.g. sources/spawns)
