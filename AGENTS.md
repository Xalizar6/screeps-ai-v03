# Agent Instructions (Screeps + TypeScript)

This file is the **repo-wide baseline** for AI work in this codebase. Folder-specific conventions live in nested `AGENTS.md` files (for example `src/roles/AGENTS.md` and `src/management/AGENTS.md`).

For assistant persona and response-style rules, follow `.cursor/rules/screeps-tutor.mdc`.

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