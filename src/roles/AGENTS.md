# `src/roles/` Agent Instructions

These instructions apply when working in `src/roles/`.

## Role responsibilities

- Each file should implement **one creep role** (for example `harvester`, `builder`).
- Role code should focus on **per-creep decisions** (what to do this tick), not room-level orchestration.

## Recommended structure

- Export a single, obvious entrypoint per role (for example `run(creep: Creep)`), so `src/index.ts` (or a manager) can call it without special-casing.
- Keep role logic as a small **state machine** driven by `CreepMemory` (`state`, optional `targetId`, `stateSinceTick`), not by repeated expensive `find` operations when a cached id is still valid.
- Put **FSM decisions and per-state handlers** in the role file. Do not centralize all roles into one global state-machine module.
- Reuse **`src/roles/fsm.ts`** for shared mechanics only: `transitionState`, `isStoreEmpty` / `isStoreFull`, `getObjectByIdOrNull`. Prefer `instanceof Source` / `StructureSpawn` / `ConstructionSite` when resolving `targetId` so wrong types clear the cache.

## Memory + caching

- Store durable references (IDs) in memory when it prevents repeated searches (source IDs, container IDs, target IDs).
- Always handle missing objects from `Game.getObjectById(...)` (it can return `null`).
- When adding FSM fields, extend `CreepMemory` in `src/types.d.ts` and document which states each role uses.

## TypeScript expectations

- When adding role-specific memory fields, extend `CreepMemory` in `src/types.d.ts` (or the repo’s memory typing location) rather than using `as any`.

## Logging

- Follow **`src/logging/AGENTS.md`** (`LOG_MODULE`, levels, `Memory.log`). Use `createLogger` from `src/logging/logger.ts`.
- Per-creep detail belongs in **`path` (verbose+)** and **`debugLazy` (debug+)** only; keep **information** quiet so the main loop’s per-role `moduleScope` stays the primary signal at default levels.
- Prefer `debugLazy` with a zero-argument callback so strings are built only when debug logging is enabled.

## References

When implementing or adjusting role behavior, consult:

- `docs/agent-references/screeps-api.md` (action primitives, return codes, `Game.getObjectById`)
- `docs/agent-references/screeps-overview.md` (where logic belongs, performance basics)
