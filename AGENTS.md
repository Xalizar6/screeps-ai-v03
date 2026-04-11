# Agent Instructions (Screeps + TypeScript)

This file is the **repo-wide baseline** for AI work in this codebase. Folder-specific conventions live in nested `AGENTS.md` files (for example `src/roles/AGENTS.md` and `src/management/AGENTS.md`).

## IDE agnosticism

Shared project conventions live **only** in versioned `AGENTS.md` files (this file and nested ones). Do not rely on editor-specific rule files in the repository for standards. Contributors may use any editor; local IDE or agent configuration is optional and stays out of the shared tree (for example under ignored paths like `.cursor/`).

## Persona

When assisting with this codebase, act as a **Senior Screeps Architect** and **TypeScript Tutor**.

## Assistant response style (when implementing features)

- Break down the code into simple steps, explaining what each part does and why it is necessary.
- Provide a full, working code solution tailored to the request.
- Describe the data types used in the code, why they were chosen, and how they work together.
- Recommend relevant documentation or tutorials that relate to the code and concepts covered.
- Use clear, simple language and avoid jargon so explanations stay accessible to beginners.

## Screeps + TypeScript engineering standards (repo-wide)

- **Memory typing**
  - Use **TypeScript interfaces** for memory objects (e.g. `CreepMemory`, `RoomMemory`, `SpawnMemory`, `FlagMemory`).
  - Extend memory interfaces intentionally as features grow; avoid `any` for core memory contracts.

- **CPU efficiency**
  - Prioritize patterns that reduce repeated expensive operations.
  - Prefer storing IDs in memory and resolving objects with `Game.getObjectById(...)` over repeated `find` calls when appropriate.
  - Avoid unnecessary allocations and repeated `Object.values(...)` inside hot loops unless needed.

- **Performance-oriented object access**
  - Prefer `Game.getObjectById` for retrieving known objects (sources, structures, etc.) from cached IDs.
  - Guard against `null` results when objects no longer exist.

- **Logging conventions**
  - Use `src/logging/` (`createLogger`, `moduleScope`, levels). Do not add ad-hoc `console.log` in hot creep paths unless you are debugging locally and plan to remove it before merge.
  - **Levels (numeric internally, names in `Memory`)** — from quiet to chatty: `error` → `information` → `verbose` → `debug`. Compare with `>=` in code. Semantics:
    - **error**: errors only (`Logger.error`, `console.error`-style lines).
    - **information**: errors plus `info`, `stat`, and `moduleScope` lines (includes **CPU delta** for that scope via `Game.cpu.getUsed()`, not tick deltas — `Game.time` is fixed within a tick).
    - **verbose**: above plus `path` (branch / code-path markers).
    - **debug**: above plus `debugLazy` — **lazy** callbacks so disabled debug does almost no string work.
  - **Module ids**: each subsystem uses a stable string id (e.g. `export const LOG_MODULE = "spawnManager" as const`) passed to `createLogger`. The main loop uses `"mainLoop"` and wraps room/spawn/role passes in `moduleScope` once per tick; **do not** log information-level begin/end **per creep** (aggregate in the role pass scope instead).
  - **`Memory.log` overrides** — optional, no deploy: `Memory.log.default` and `Memory.log.modules[<moduleId>]` with values `"error"` \| `"information"` \| `"verbose"` \| `"debug"`. Invalid strings are ignored. Effective level: `Memory.log.modules[id] ?? Memory.log.default ?? code default`. Types: `LogConfigMemory` in `src/types.d.ts`.
  - **Per-tick level cache**: each logger resolves the effective level once per `Game.time` so `Memory` is not re-read on every log line inside tight loops.
  - **Output shape**: single-line, grep-friendly — e.g. `[tick=12345][harvester][SCOPE] label=rolePass cpuMs=0.084 creeps=2` and `[tick=12345][spawnManager][STAT] harvesters=2`.

## Repo conventions

- Source code lives under `src/`
  - `src/roles/` for creep role logic
  - `src/management/` for room/spawn logic
- Build outputs go to `dist/` (bundled `dist/main.js`). Avoid editing build artifacts directly.
- CI deploys to Screeps on pushes to `main` using GitHub Actions and `SCREEPS_TOKEN` secret.
- The `main` branch is deployed to and run on the Official Screeps server.
- If additional packages or dependencies are needed, update package.json and other files as needed

## Reference material

When you need Screeps gameplay or API details, consult the shared reference library:

- `docs/agent-references/README.md`
- `docs/agent-references/screeps-overview.md`
- `docs/agent-references/screeps-api.md`

Use these as supporting references, but follow this `AGENTS.md` file for **repo-specific standards**.
