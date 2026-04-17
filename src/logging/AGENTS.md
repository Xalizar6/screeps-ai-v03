# `src/logging/` Agent Instructions

These instructions apply when working in `src/logging/` and when adding or changing logging in any module.

## Layout

- `logger.ts` — `createLogger`, `Logger` API (`error`, `info`, `stat`, `path`, `debugLazy`, `moduleScope`, `blankLineAfterTick`).
- `levels.ts` — numeric `LogLevel`, string names (`LogLevelName`), `parseLogLevel` / `levelToString`.
- `resolveLevel.ts` — `getEffectiveLevel(moduleId, codeDefault)` reads `Memory.log` and applies overrides.

## JSDoc

- Follow the **Documentation in code (JSDoc)** section in the root `AGENTS.md`. Each exported or internal helper here should have a one-line summary so level resolution and formatting stay approachable when you are new to the module.

## `LOG_MODULE` (required for feature modules)

Each subsystem that logs should export a **single stable string id** used everywhere that module is referenced for logging:

```ts
export const LOG_MODULE = "spawnManager" as const;
```

Pass `LOG_MODULE` into `createLogger(LOG_MODULE, { defaultLevel: ... })`. The string must stay stable across deploys so `Memory.log.modules` overrides keep working.

**Who exports it**

- **Role files** (`src/roles/*.ts`): `LOG_MODULE` matches the role name / `Memory.log.modules` key (e.g. `"harvester"`).
- **Management files** (`src/management/*.ts`): one `LOG_MODULE` per file (e.g. `"roomManager"`, `"spawnManager"`).

**Main loop**

- `src/index.ts` may import each module’s `LOG_MODULE` and construct loggers with those ids (avoids duplicating string literals).
- The tick entry logger may use a literal id only in the main file, e.g. `createLogger("mainLoop", ...)`, since there is no separate `mainLoop` module file.

**Naming**

- Use camelCase ids that match the module’s purpose; keep them short and grep-friendly.

## Usage rules

- Use `createLogger` and `moduleScope` from this folder. Do not add ad-hoc `console.log` in hot creep paths unless you are debugging locally and plan to remove it before merge.

## Log levels

Levels are **numeric internally**; **`Memory`** stores **string names**. Comparisons in code use `>=` against `LogLevel` from `levels.ts`. Order from quiet to chatty:

| Name in `Memory` | Semantics                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`          | Errors only (`Logger.error`, `console.error`-style lines).                                                                                                                              |
| `information`    | Above plus `info`, `stat`, and `moduleScope` lines. `moduleScope` records **CPU delta for that scope** via `Game.cpu.getUsed()` (not tick deltas — `Game.time` is fixed within a tick). |
| `verbose`        | Above plus `path` (branch / code-path markers).                                                                                                                                         |
| `debug`          | Above plus `debugLazy` — **lazy** callbacks so disabled debug does almost no string work.                                                                                               |

## `Memory.log` overrides

Optional; no deploy required:

- `Memory.log.default` — global default level name.
- `Memory.log.modules[<moduleId>]` — per-module override; `moduleId` is the same string as `LOG_MODULE` / `createLogger`’s first argument.

Allowed values: `"error"` | `"information"` | `"verbose"` | `"debug"`. Invalid strings are ignored.

**Effective level:** `Memory.log.modules[id] ?? Memory.log.default ?? code default` (see `getEffectiveLevel` in `resolveLevel.ts`).

Types: `LogConfigMemory` on `Memory.log` in `src/types.d.ts`.

## Per-tick level cache

Each logger resolves the effective level **once per `Game.time`** so `Memory` is not re-read on every log line inside tight loops (`logger.ts` caches after `getEffectiveLevel`).

## `moduleScope` and the main loop

- Wrap room passes, spawn passes, and **role passes** in `moduleScope` **once per tick**, not per creep.
- **Do not** log information-level begin/end **per creep**; aggregate in the role-pass scope instead (e.g. `endStats` with creep counts).

## Output shape

Single-line, grep-friendly examples:

- `[tick=12345][harvester][SCOPE] label=rolePass cpuMs=0.084 creeps=2`
- `[tick=12345][spawnManager][STAT] harvesters=2`

Tags include `ERROR`, `INFO`, `STAT`, `PATH`, `DEBUG`, `SCOPE` as implemented in `formatLine` in `logger.ts`.

## Folder-specific notes

- **`src/roles/`** — Per-creep detail belongs in **`path` (verbose+)** and **`debugLazy` (debug+)** only; keep **information** quiet so per-role `moduleScope` stays the primary signal at default levels. Prefer `debugLazy(() => "...")` so strings are built only when debug is enabled.
- **`src/management/`** — Prefer **`info` / `stat` / `moduleScope`** at information level; use **`path` / `debugLazy`** for deeper diagnosis. Avoid per-structure spam inside tight `room.find` loops unless gated by verbosity.
