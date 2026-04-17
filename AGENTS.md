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
  - Shared **helpers only** live in `src/roles/fsm.ts` (store checks, `transitionState`, `runFsm`, `getObjectByIdOrNull`). Do not extend `Creep.prototype` for simple guards; prefer pure helpers.
  - Persist `CreepMemory.state`, optional `targetId`, and `stateSinceTick` via `src/types.d.ts`; resolve cached IDs with `instanceof` or null checks so stale targets are cleared.

- **Documentation in code (JSDoc)** — Treat comments as a **mini-tutorial** for anyone reading the file (including future you). TypeScript uses JSDoc for tooling and readability; see the [TypeScript JSDoc reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html).
  - **Every named function** declared at **module scope** (exported or private `function foo` / `const foo = () =>`) should have a **`/** ... \*/`** block **directly above\*\* the declaration.
  - **Minimum content**
    - **Summary** (required, one line): what the function does and when to call it (intent, not a line-by-line repeat of the body).
    - **Second sentence** (optional): why it exists if the name alone does not answer that (e.g. “Split out so … can be unit-tested” or “Avoids duplicate `PathFinder` calls”).
  - **Add `@param` and `@returns`** when argument meaning, units, or the return value (including `null`, booleans meaning success, or Screeps error codes) is not obvious from types and names alone.
  - **Side effects**: mention in the summary or a `@remarks` line when the function touches **`Memory`**, creates construction sites, enqueues spawns, writes logs at information level, or mutates global `Game` state — readers need to know without reading the whole body.
  - **Exceptions** (summary still welcome when it helps): inline callbacks passed to `.map` / `.forEach` / `sort`, and trivial accessors whose comment would only restate the identifier. **Not** exempt: helpers used by roles or room logic — document those.
  - **Update JSDoc when behavior changes** (same as code review).
  - **Shape** (copy and trim tags you do not need):

```ts
/**
 * One-line summary: what this does and when to call it.
 * @param room Room being planned; caller must ensure …
 * @returns Whether the operation succeeded (`OK` path only).
 */
```

- **Logging** — Use `src/logging/` (`createLogger`, `moduleScope`, levels). Full conventions, `LOG_MODULE` export rules, `Memory.log`, and level semantics: **`src/logging/AGENTS.md`**.

## Repo conventions

- Source code lives under `src/`
  - `src/roles/` for creep role logic
  - `src/management/` for room/spawn logic
- Build outputs go to `dist/` (bundled `dist/main.js`). Avoid editing build artifacts directly.
- When verifying changes locally, run **`npm run fix`** before **`npm run build`**, so auto-fixable ESLint and Prettier issues are resolved before `build` runs non-mutating checks (`lint`, `format:check`, typecheck, and bundling).
  - **Windows PowerShell 5.1** (default on many Windows installs) does not support `&&` in one-liners; run the two npm commands on separate lines, use `npm run fix; if ($LASTEXITCODE -eq 0) { npm run build }` for conditional chaining, or use **PowerShell 7** (`pwsh`), cmd, or Git Bash where `&&` works.
- CI deploys via GitHub Actions: pushes to **`main`** upload to the Official server (`screeps.com`, in-game branch `main`) using the `SCREEPS_TOKEN` secret; pushes to **`test`** upload to a community server using variable `SCREEPS_TEST_HOST`, optional variables `SCREEPS_TEST_PROTOCOL` / `SCREEPS_TEST_PORT` (many community hosts use `http` and port 80 or 21025), optional `SCREEPS_TEST_BRANCH`, and either secret `SCREEPS_TEST_TOKEN` or secrets `SCREEPS_TEST_USERNAME` + `SCREEPS_TEST_PASSWORD` (see `scripts/upload-screeps.js` and README). Never commit credentials; use Actions secrets and a gitignored `.env` locally ([`.env.example`](.env.example)).
- The `main` branch is deployed to and run on the Official Screeps server.
- If additional packages or dependencies are needed, update package.json and other files as needed
- treat docs/scratchpad.md as personal notes only; do not use it as project reference unless the user explicitly points you there

## Documentation upkeep

When a change affects how the project is built, run, deployed, organized, or how agents or contributors should work:

- Update the **root `README.md`** for setup, scripts, CI/deploy notes, and other contributor-facing overview that no longer matches reality.
- Update **nested `README.md` files** (for example `docs/agent-references/README.md`) when the scope or index they describe changes.
- Update **this root `AGENTS.md`** when repo-wide standards or global agent instructions change.
- Update **nested `AGENTS.md` files** when folder-specific conventions change (for example `src/logging/AGENTS.md` after logging contract changes).

Keep documentation edits scoped to what the code change actually affects; avoid drive-by rewrites of unrelated docs.

## Reference material

When you need Screeps gameplay or API details, consult the shared reference library:

- `docs/agent-references/README.md`
- `docs/agent-references/screeps-overview.md`
- `docs/agent-references/screeps-api.md`

Canonical Screeps docs: `https://docs.screeps.com/index.html` and API reference `https://docs.screeps.com/api/`.

Before changing creep actions, intents, CPU usage, or memory contracts, **read the linked references first** (local notes plus canonical API when behavior is not spelled out in-repo). Do not assume intent rules (for example one intent per action type per tick, movement as a separate intent, or return codes such as `ERR_BUSY` / `ERR_NOT_IN_RANGE`). If a change depends on exact API behavior and local notes do not cover it, confirm against `https://docs.screeps.com/api/` and cite that source in plans or PRs.

Use these as supporting references, but follow this `AGENTS.md` file for **repo-specific standards**.
