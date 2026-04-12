# Agent Instructions (Screeps + TypeScript)

This file is the **repo-wide baseline** for AI work in this codebase. Folder-specific conventions live in nested `AGENTS.md` files (for example `src/logging/AGENTS.md`, `src/roles/AGENTS.md`, and `src/management/AGENTS.md`).

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

- **Creep behavior (finite state machines)**
  - Each role in `src/roles/` owns its FSM: states, transitions, and per-state actions live in that role file (not in one shared cross-role machine).
  - Shared **helpers only** live in `src/roles/fsm.ts` (store checks, `transitionState`, `getObjectByIdOrNull`). Do not extend `Creep.prototype` for simple guards; prefer pure helpers.
  - Persist `CreepMemory.state`, optional `targetId`, and `stateSinceTick` via `src/types.d.ts`; resolve cached IDs with `instanceof` or null checks so stale targets are cleared.

- **Logging** — Use `src/logging/` (`createLogger`, `moduleScope`, levels). Full conventions, `LOG_MODULE` export rules, `Memory.log`, and level semantics: **`src/logging/AGENTS.md`**.

## Repo conventions

- Source code lives under `src/`
  - `src/roles/` for creep role logic
  - `src/management/` for room/spawn logic
- Build outputs go to `dist/` (bundled `dist/main.js`). Avoid editing build artifacts directly.
- When verifying changes locally, run **`npm run fix`** before **`npm run build`**, so auto-fixable ESLint and Prettier issues are resolved before `build` runs non-mutating checks (`lint`, `format:check`, typecheck, and bundling).
- CI deploys to Screeps on pushes to `main` using GitHub Actions and `SCREEPS_TOKEN` secret.
- The `main` branch is deployed to and run on the Official Screeps server.
- If additional packages or dependencies are needed, update package.json and other files as needed
- treat docs/scratchpad.md as personal notes only; do not use it as project reference unless the user explicitly points you there

## Reference material

When you need Screeps gameplay or API details, consult the shared reference library:

- `docs/agent-references/README.md`
- `docs/agent-references/screeps-overview.md`
- `docs/agent-references/screeps-api.md`

Use these as supporting references, but follow this `AGENTS.md` file for **repo-specific standards**.
