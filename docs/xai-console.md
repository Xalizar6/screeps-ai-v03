# `xai` console helpers

In-game commands attached to `global.xai` from [`src/console.ts`](../src/console.ts) (wired in [`src/index.ts`](../src/index.ts)). Run from the Screeps console; return values print automatically.

**Logging vs rooms:** `xai.log.*` only touches **`Memory.log`** (one global object for your account in this world). It does **not** write under `Memory.rooms["sim"]` or any room name. Use `JSON.stringify(Memory.log)` to verify. If the bare name `xai` is undefined in the console, call `global.xai.log.set(...)`.

## Command reference

| Command                               | Effect                                                                                                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xai.help()`                          | Short overview of `xai.log` and `xai.room`.                                                                                                                                                                                     |
| `xai.log.help()`                      | Help text with examples for log helpers.                                                                                                                                                                                        |
| `xai.log.set(level, overrides?)`      | **Updates** `Memory.log` (in place): `default`, and optional `modules` / `groups` from `overrides`. Omitted `modules`/`groups` keys are removed.                                                                                |
| `xai.log.reset()`                     | `delete Memory.log` (code defaults).                                                                                                                                                                                            |
| `xai.log.setGroup(group, level)`      | Merges into `Memory.log.groups[group]`.                                                                                                                                                                                         |
| `xai.log.clearGroup(group)`           | Removes one group override.                                                                                                                                                                                                     |
| `xai.log.setModule(module, level)`    | Merges into `Memory.log.modules[module]`.                                                                                                                                                                                       |
| `xai.log.clearModule(module)`         | Removes one module override.                                                                                                                                                                                                    |
| `xai.room.help()`                     | Help text with examples for room helpers.                                                                                                                                                                                       |
| `xai.room.use(roomName)`              | Sets session **cursor** on the `xai.room` object (not persisted in Memory).                                                                                                                                                     |
| `xai.room.viz(roomName?)`             | Sets `layoutVisualize = true`.                                                                                                                                                                                                  |
| `xai.room.noviz(roomName?)`           | Deletes `layoutVisualize`.                                                                                                                                                                                                      |
| `xai.room.rclFilter(rcl?, roomName?)` | If `rcl > 0`, sets `layoutVisualizeRcl`. If `rcl` is `0` or omitted, deletes `layoutVisualizeRcl`.                                                                                                                              |
| `xai.room.clearPlan(roomName?)`       | Deletes **both** `layoutPlan` and `layoutApproved`. `planGenerator` usually **recreates `layoutPlan`** on the next tick when the CPU bucket allows (see [`planGenerator.ts`](../src/management/construction/planGenerator.ts)). |
| `xai.room.approve(roomName?)`         | Sets `layoutApproved = true`. Warns (console + message) if `layoutPlan` is missing.                                                                                                                                             |
| `xai.room.unapprove(roomName?)`       | Deletes `layoutApproved`.                                                                                                                                                                                                       |

### Room name resolution (all `xai.room.*`)

1. If `roomName` is passed, use it.
2. Else if `xai.room.use(...)` was called this global, use that cursor.
3. Else if exactly one key exists in `Game.rooms`, use it.
4. Else return an error string listing visible room names (or stating none).

## Known log groups

These match `createLogger(..., { group })` in the codebase:

| Group        | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `management` | Loggers under `src/management/` (per-file `LOG_MODULE`). |
| `roles`      | Loggers under `src/roles/` (role / shared role helpers). |

## Known log modules (`LOG_MODULE`)

Stable ids for `Memory.log.modules[...]` (grep: `export const LOG_MODULE`):

| Module id           | Source file                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `mainLoop`          | [`src/index.ts`](../src/index.ts) (literal id; not a separate module file)                                |
| `creepMemoryGc`     | [`src/management/creepMemoryGc.ts`](../src/management/creepMemoryGc.ts)                                   |
| `roomManager`       | [`src/management/roomManager.ts`](../src/management/roomManager.ts)                                       |
| `spawnManager`      | [`src/management/spawnManager.ts`](../src/management/spawnManager.ts)                                     |
| `roomCache`         | [`src/management/roomCache.ts`](../src/management/roomCache.ts)                                           |
| `structureCache`    | [`src/management/structureCache.ts`](../src/management/structureCache.ts)                                 |
| `roomConstruction`  | [`src/management/roomConstruction.ts`](../src/management/roomConstruction.ts)                             |
| `planGenerator`     | [`src/management/construction/planGenerator.ts`](../src/management/construction/planGenerator.ts)         |
| `layoutConstructor` | [`src/management/construction/layoutConstructor.ts`](../src/management/construction/layoutConstructor.ts) |
| `layoutVisualizer`  | [`src/management/construction/layoutVisualizer.ts`](../src/management/construction/layoutVisualizer.ts)   |
| `builder`           | [`src/roles/builder.ts`](../src/roles/builder.ts)                                                         |
| `harvester`         | [`src/roles/harvester.ts`](../src/roles/harvester.ts)                                                     |
| `repairer`          | [`src/roles/repairer.ts`](../src/roles/repairer.ts)                                                       |
| `shuttle`           | [`src/roles/shuttle.ts`](../src/roles/shuttle.ts)                                                         |
| `upgrader`          | [`src/roles/upgrader.ts`](../src/roles/upgrader.ts)                                                       |
| `energyAcquisition` | [`src/roles/energyAcquisition.ts`](../src/roles/energyAcquisition.ts)                                     |
| `fsm`               | [`src/roles/fsm.ts`](../src/roles/fsm.ts)                                                                 |

Add new rows here when you add a new `LOG_MODULE`.

## Checklist: adding a new `xai` sub-namespace

1. Extend typing in [`src/types.d.ts`](../src/types.d.ts): add a `GlobalXai*` interface, add the property to `GlobalXai`, and keep `declare var xai` accurate.
2. Implement in [`src/console.ts`](../src/console.ts): nested object with `help()` and commands; every module-scope function gets a one-line JSDoc (see [`docs/agent-references/jsdoc-conventions.md`](agent-references/jsdoc-conventions.md)).
3. Wire bootstrap: assign `global.xai` once at module scope in [`src/index.ts`](../src/index.ts) (outside `loop`).
4. Update this file: command table + any new lists (groups/modules if relevant).
5. If the feature changes contributor workflow, add a one-line pointer in root [`AGENTS.md`](../AGENTS.md) or the relevant nested `AGENTS.md`.

## See also

- [`src/logging/AGENTS.md`](../src/logging/AGENTS.md) — `Memory.log`, effective level, `LOG_MODULE`.
