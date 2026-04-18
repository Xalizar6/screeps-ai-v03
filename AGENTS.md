# Agent Instructions (Screeps + TypeScript)

Repo-wide baseline for AI work in this codebase. **Nested `AGENTS.md` files extend these defaults** for their folders; on overlapping topics, **the narrower (folder) file wins** over this root (e.g. `src/logging/AGENTS.md`, `src/roles/AGENTS.md`, `src/management/AGENTS.md`).

## IDE agnosticism

Shared conventions live in versioned `AGENTS.md` files only—not editor-specific rule trees in the repo. Optional local IDE/agent config stays out of the shared tree (e.g. ignored `.cursor/`).

## Skills vs AGENTS

- **On-demand** procedures and checklists: **`.agents/skills/`** (portable, editor-agnostic).
- **Always-on** standards: **`AGENTS.md`** files. Keep each skill concise; put long examples in per-skill `references/`.

## Screeps + TypeScript (repo-wide)

- **Memory typing** — Use TypeScript interfaces for memory shapes (`CreepMemory`, `RoomMemory`, `SpawnMemory`, `FlagMemory`). Extend deliberately; avoid `any` for core memory contracts.
- **CPU / object access** — Prefer IDs in memory + `Game.getObjectById(...)` over repeated `find` where appropriate; always null-check. Avoid unnecessary allocations and repeated `Object.values(...)` in hot loops unless needed.
- **Role FSM** — Each role in `src/roles/` owns its FSM in that role file (not one global cross-role machine). Shared mechanics only in `src/roles/fsm.ts` (e.g. store checks, `transitionState`, `runFsm`, `getObjectByIdOrNull`). Prefer pure helpers over `Creep.prototype` for trivial guards. Persist `CreepMemory.state`, optional `targetId`, and `stateSinceTick` via `src/types.d.ts`; resolve cached IDs with `instanceof` or null checks so stale targets clear.
- **JSDoc** — Every module-scope function needs at least a one-line `/** … */` summary; add `@param` / `@returns` and note side effects when non-obvious. **Full rules and examples:** [`docs/agent-references/jsdoc-conventions.md`](docs/agent-references/jsdoc-conventions.md).
- **Logging** — Use `src/logging/` (`createLogger`, `moduleScope`, levels). **`src/logging/AGENTS.md`** — `LOG_MODULE`, `Memory.log`, level semantics.

## Repo layout

- **`src/roles/`** — creep role logic. **`src/management/`** — room/spawn coordination.
- **Build output** — `dist/` (e.g. `dist/main.js`). Do not edit bundled artifacts by hand.
- **Dependencies** — When adding packages, update `package.json` (and lockfile as appropriate) with the change.

## Local verify

Run **`npm run fix`** then **`npm run build`** so ESLint/Prettier fixes apply before non-mutating checks and the bundle. **Windows PowerShell 5.1** does not support `&&` in one-liners—run the two commands on separate lines, use `npm run fix; if ($LASTEXITCODE -eq 0) { npm run build }`, or use **PowerShell 7** (`pwsh`), cmd, or Git Bash. (See also [`README.md`](README.md) scripts.)

## CI and credentials

Never commit passwords, tokens, or `.env`. Use GitHub Actions secrets for CI and a gitignored `.env` locally. **Branch targets, workflow files, and env variable names:** [`README.md`](README.md) (CI and deploy) and [`.env.example`](.env.example).

## Screeps references (routing)

Consult **[`docs/agent-references/README.md`](docs/agent-references/README.md)** first (index, routing, links to official docs). Before changing creep actions, intents, CPU usage, or memory contracts, read **`docs/agent-references/screeps-api.md`** (and gameplay-oriented refs there if strategy changes). Repo-specific standards stay in `AGENTS.md` files; reference docs are supporting material.

## Documentation upkeep

When build, deploy, layout, or agent/contributor workflows change: update **`README.md`**, any affected nested **`README.md`**, this file for **repo-wide** rules only, and nested **`AGENTS.md`** for folder contracts. Keep edits scoped to what the code change touched.

## Personal notes

Treat `docs/scratchpad.*` as personal notes only—not project reference unless the user points you there.

## Teaching style (on-demand)

For step-by-step explanations, TypeScript rationale, and human checkpoints, use skill **`/screeps-learning-loop`** — [`.agents/skills/screeps-learning-loop/`](.agents/skills/screeps-learning-loop/).
