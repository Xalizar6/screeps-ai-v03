# `src/management/` Agent Instructions

These instructions apply when working in `src/management/`.

## Responsibilities

- Management modules coordinate **room/spawn-level decisions** (e.g. population targets, spawn queues, room-wide caching).
- Avoid embedding detailed per-creep behavior here; delegate to role modules in `src/roles/`.
- **Automated layout / construction planning** (e.g. where to place structures or sites) lives in dedicated modules such as `roomConstruction.ts`; if that grows, split under `construction/` and keep `roomManager` as the orchestrator that calls into them.
- **Room-level persistent cache** (e.g. source IDs and nearby container IDs for energy routing) lives in **`roomCache.ts`** (`runRoomCache`); `roomManager` calls it each tick before construction planning. Extend here as you add more room-scoped cached data (minerals, links, etc.).

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

- Follow the **Documentation in code (JSDoc)** section in the root `AGENTS.md`.
- **Every** module-scope `function` / `const` helper in this folder should have at least a one-line `/** summary */` above it so construction and cache files read clearly when you are learning the flow.

## Logging

- Export `LOG_MODULE` and follow **`src/logging/AGENTS.md`** for `createLogger` / `Memory.log.modules` and shared conventions.
- Prefer **`info` / `stat` / `moduleScope`** at information level; use **`path` / `debugLazy`** for deeper diagnosis. Avoid per-structure spam inside tight `room.find` loops unless gated by verbosity.

## References

When implementing room/spawn orchestration or caching, consult:

- `docs/agent-references/screeps-api.md` (room queries, CPU bucket, soft references via `Game.getObjectById`)
- `docs/agent-references/screeps-overview.md` (CPU + data flow, gameplay assumptions e.g. sources/spawns)
