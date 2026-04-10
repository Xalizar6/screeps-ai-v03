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

## Common action primitives

- Harvesting: `creep.harvest(source)`
- Upgrading: `creep.upgradeController(controller)`
- Building: `creep.build(site)`
- Repair: `creep.repair(structure)`
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

