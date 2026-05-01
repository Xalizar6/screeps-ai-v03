# `src/roles/` Agent Instructions

These instructions apply when working in `src/roles/`.

## Role responsibilities

- Each file should implement **one creep role** (for example `harvester`, `builder`).
- Role code should focus on **per-creep decisions** (what to do this tick), not room-level orchestration.

## Current files

| File                   | Responsibility                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `fsm.ts`               | Shared FSM helpers: `transitionState`, `runFsm`, `isStoreEmpty`, `isStoreFull`, `getObjectByIdOrNull`, `resolveSource` |
| `energyAcquisition.ts` | Shared `acquireEnergy` helper: container withdraw → dropped pickup → harvest fallback                                  |
| `harvester.ts`         | Mines sources; deposits to spawn/extensions (or sits at container when shuttles present)                               |
| `upgrader.ts`          | Fills energy from controller container; upgrades controller                                                            |
| `shuttle.ts`           | Energy courier: picks up from containers/dropped, delivers to structures                                               |
| `builder.ts`           | Acquires energy; builds construction sites                                                                             |
| `repairer.ts`          | Acquires energy; repairs damaged structures per `repairConfig` thresholds                                              |

## Recommended structure

- Export a single, obvious entrypoint per role (for example `run(creep: Creep)`), so `src/index.ts` (or a manager) can call it without special-casing.
- Keep role logic as a small **state machine** driven by `CreepMemory` (`state`, optional `targetId`, `stateSinceTick`), not by repeated expensive `find` operations when a cached id is still valid.
- Put **FSM decisions and per-state handlers** in the role file. Do not centralize all roles into one global state-machine module.
- Reuse **`src/roles/fsm.ts`** for shared mechanics only: `transitionState`, `runFsm` (same-tick re-dispatch after a state change so the new state can `moveTo` without idling a tick), `isStoreEmpty` / `isStoreFull`, `getObjectByIdOrNull`, `resolveSource` (cached closest active source). Prefer `instanceof Source` / `StructureSpawn` / `ConstructionSite` when resolving `targetId` so wrong types clear the cache.
- Use **`src/roles/energyAcquisition.ts`** for shared **energy pickup** (`acquireEnergy`): withdraw from source-adjacent containers (when enough energy), pickup dropped energy near sources, then harvest fallback. Room-level source/container IDs live in `RoomMemory.sources` (maintained by `src/management/roomCache.ts`).

## Memory + caching

- Store durable references (IDs) in memory when it prevents repeated searches (source IDs, container IDs, target IDs).
- Always handle missing objects from `Game.getObjectById(...)` (it can return `null`).
- When adding FSM fields, extend `CreepMemory` in `src/types.d.ts` and document which states each role uses.
- Do not gate FSM transitions on `creep.store` immediately after `transfer` / `withdraw` / `pickup` — intents resolve at end-of-tick; prefer store checks at the **top** of the handler (see **Intent timing** in `docs/agent-references/screeps-api.md`).
- Do not issue **two dependent actions from the same official pipeline** in one tick unless you intend the **rightmost** to win; see **Action priority matrix** in `docs/agent-references/screeps-api.md` and [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html). Verify behavior next tick if return codes look `OK` but the creep did not act as expected.

### `targetId` lifecycle pattern

The standard pattern for any cached object reference in a role handler:

```ts
function resolveTarget(creep: Creep): StructureSpawn | null {
  // 1. Try cached ID
  const raw = creep.memory.targetId
    ? Game.getObjectById(creep.memory.targetId)
    : null;
  if (
    raw instanceof StructureSpawn &&
    raw.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  ) {
    return raw; // cache hit — reuse without a find
  }
  // 2. Clear stale cache (wrong type, destroyed, or no longer valid)
  if (raw) delete creep.memory.targetId;

  // 3. Acquire a new target
  const target = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
  if (target) creep.memory.targetId = target.id;
  return target;
}
```

Key rules:

- Use `instanceof` to verify the resolved object is the expected type — wrong types clear the cache.
- Always delete the cached ID when the target is gone or no longer valid, so re-acquisition happens next tick.
- Prefer `findClosestByPath` or a pre-cached room-level list over `room.find` every tick.

## TypeScript expectations

- When adding role-specific memory fields, extend `CreepMemory` in `src/types.d.ts` (or the repo’s memory typing location) rather than using `as any`.

## JSDoc

- Follow root [`AGENTS.md`](../../AGENTS.md) and **[`docs/agent-references/jsdoc-conventions.md`](../../docs/agent-references/jsdoc-conventions.md)**.
- **Every** module-scope helper in a role file (state handlers, target resolvers, small guards) should have at least a one-line summary above it so the FSM reads top-to-bottom like a short tutorial.

## Logging

- Follow **`src/logging/AGENTS.md`** (`LOG_MODULE`, levels, `Memory.log`). Use `createLogger` from `src/logging/logger.ts`.
- Per-creep detail belongs in **`path` (verbose+)** and **`debugLazy` (debug+)** only; keep **information** quiet so the main loop’s per-role `moduleScope` stays the primary signal at default levels.
- Prefer `debugLazy` with a zero-argument callback so strings are built only when debug logging is enabled.

## References

When implementing or adjusting role behavior, consult:

- `docs/agent-references/screeps-api.md` (action priority matrix, intent timing, return codes, `Game.getObjectById`)
- `docs/agent-references/screeps-overview.md` (where logic belongs, performance basics, gameplay pointers)
