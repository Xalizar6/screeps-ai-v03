# Screeps API Notes (curated)

Source: `https://docs.screeps.com/api/`

This doc is **not** a full API mirror. It’s a curated set of API details and patterns that are frequently relevant while implementing behaviors in this repo.

## Frequently used globals

- `Game`
  - `Game.creeps`, `Game.rooms`, `Game.spawns`
  - `Game.time`
  - `Game.getObjectById<T>(id)` for resolving stored IDs

- `Memory`
  - Persistent JSON-like store.
  - Use typed interfaces in this repo (extend `CreepMemory`, `RoomMemory`, etc.).

## Soft references: `Game.getObjectById`

- Pattern:
  - Store `id: Id<_HasId>` in memory.
  - Each tick resolve via `Game.getObjectById(id)`.
  - Handle `null` (object might no longer exist).

Why:

- Avoid repeated `find(...)` scans in hot loops.
- Keeps role/management logic CPU-friendly.

## Room queries: `Room.find`

`Room.find(constant, [opts])` is powerful but can be expensive if used repeatedly.

Prefer:

- A single “room pass” in management to gather shared targets once per tick.
- Storing durable targets as IDs in memory where it makes sense.

## Creep action return codes

Most creep actions return an error code (`OK`, `ERR_NOT_IN_RANGE`, etc.).

Common pattern:

- Attempt action
- If `ERR_NOT_IN_RANGE`, `creep.moveTo(target)` (or your project’s movement helper)
- If invalid target, clear cached ID and re-select

## Intent timing and `creep.store` within a tick

Screeps actions are **intents** queued on the creep and resolved at end-of-tick (see [game loop](https://docs.screeps.com/game-loop.html) and [API](https://docs.screeps.com/api/)). Practical implications for role logic:

- After `creep.transfer(...)`, `creep.withdraw(...)`, or `creep.pickup(...)` returns `OK`, `creep.store` is **not guaranteed** to reflect the change within the same tick. Gating a state transition on `isStoreEmpty` / `isStoreFull` immediately after the call is unreliable on the official server — the check often reflects the **pre-intent** value.
- `creep.harvest(...)` often reflects gained energy in `creep.store` same-tick in practice, but do not assume cross-action consistency; prefer patterns that work regardless.
- **Safe pattern:** run store-based transition checks at the **top of the handler** (tick N+1, after end-of-tick resolution). Combined with `runFsm`’s same-tick re-dispatch in `src/roles/fsm.ts`, the new-state handler can still issue `moveTo` in the same tick it transitions.
- **Unsafe pattern:** `if (result === OK && isStoreEmpty(creep)) transitionState(...)` immediately after `creep.transfer`. This was tried for the shuttle deliver path and did not fire on the official server because `store` had not yet updated.
- If a same-tick post-action pivot is ever required, the only reliable signal is a **pre-computed delta** from the action’s inputs (for example, comparing creep carry to target free capacity before calling `transfer`). That approach has its own fragility (target state can change mid-tick) and is not used in this repo today.

### Observability: `fsm` transition logs

`transitionState` logs under the `fsm` module at `path` (verbose+). To see `[fsm][PATH] state=...` lines, set `Memory.log.modules.fsm = "verbose"` or raise `Memory.log.default` (see `src/logging/AGENTS.md`).

## Common action primitives

- Harvesting: `creep.harvest(source)`
- Upgrading: `creep.upgradeController(controller)`
- Building: `creep.build(site)`
- Repair: `creep.repair(structure)`
- Pickup (dropped resources): `creep.pickup(resource)` — target must be adjacent or on the same tile; requires `CARRY`.
- Transfer/withdraw:
  - `creep.transfer(target, resourceType)`
  - `creep.withdraw(target, resourceType)`

## Pathfinding (when needed)

Screeps provides `PathFinder.search(...)` for custom cost matrices and advanced routing.

Guideline:

- Use default `moveTo` until you have a CPU/pathing reason to go lower-level.
- If you introduce custom pathing, keep it centralized (management/util) and cache where possible.

## Project-specific reminders

- Prefer ID caching + `Game.getObjectById` for known objects.
- Null-check resolved objects and recover gracefully.
- Avoid repeated `Object.values(Game.creeps)` style scans in hot loops unless necessary.
