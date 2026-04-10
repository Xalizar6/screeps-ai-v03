# `src/management/` Agent Instructions

These instructions apply when working in `src/management/`.

## Responsibilities

- Management modules coordinate **room/spawn-level decisions** (e.g. population targets, spawn queues, room-wide caching).
- Avoid embedding detailed per-creep behavior here; delegate to role modules in `src/roles/`.

## CPU + data flow expectations

- Prefer a **single room pass** that computes/caches reusable data once, then feeds it into the rest of the tick.
- Be careful with repeated `room.find(...)` calls; cache results for the tick (or store IDs in `RoomMemory` when it makes sense).

## Memory typing

- When adding `RoomMemory` / `SpawnMemory` fields, extend the interfaces in `src/types.d.ts` (or the repo’s memory typing location).
- Treat IDs in memory as soft references: always null-check after `Game.getObjectById(...)`.

## Integration points

- Keep exported APIs small and obvious (e.g. `runRoom(room: Room)` / `runSpawns(room: Room)`), so the main loop can call them predictably.

## References

When implementing room/spawn orchestration or caching, consult:

- `docs/agent-references/screeps-api.md` (room queries, soft references via `Game.getObjectById`)
- `docs/agent-references/screeps-overview.md` (CPU + data flow expectations)
