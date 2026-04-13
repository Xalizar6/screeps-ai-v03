# screeps-ai-v03

Screeps World AI created with AI agent assistance.

## Architecture (creep roles)

- **Main loop** (`src/index.ts`): room/spawn management, then per-role passes over `Game.creeps`.
- **Roles** (`src/roles/*.ts`): each creep role is a small **finite state machine** stored in `Memory.creeps[name]` (`state`, optional `targetId`, `stateSinceTick`). Transition rules and dispatch stay **inside the role file** for cohesion. The **upgrader** role only fills energy and upgrades the room controller (RCL).
- **FSM helpers** (`src/roles/fsm.ts`): shared pure functions only (`isStoreEmpty`, `isStoreFull`, `transitionState`, `getObjectByIdOrNull`). No `Creep.prototype` extensions for trivial checks.
- **Types** (`src/types.d.ts`): extend `CreepMemory` when adding states or persisted ids.

To add a role: add `runYourRole(creep)`, extend `CreepMemory.role` / state fields, wire the role pass in `src/index.ts`, and export `LOG_MODULE` per `src/roles/AGENTS.md`.

## Logging

Logging lives in `src/logging/` (`createLogger`, levels, `Memory.log` resolution). Lines look like `[tick=…][moduleId][TAG] …`. Types for `Memory.log` are in `src/types.d.ts`.

**Levels** (strings in `Memory`, numbers in code): `error` → `information` → `verbose` → `debug`. Roughly: errors only; then `info` / `stat` / one **`moduleScope`** summary per block (includes **CPU ms** via `Game.cpu.getUsed()`—not `Game.time`, which is fixed inside a tick); then `path`; then `debugLazy` (callback skipped when off). Effective level: `Memory.log.modules[id]` → `Memory.log.default` → `createLogger`’s `defaultLevel`. Bad strings are ignored. Each logger caches the resolved level once per tick.

**API sketch:**

```ts
const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });
log.error("…"); // always
log.info("…");
log.stat("name", 1); // information+
log.path("…"); // verbose+
log.debugLazy(() => `…`); // debug only
log.moduleScope(
  "label",
  () => {},
  () => ({ creeps: 3 }),
); // optional endStats
log.blankLineAfterTick(); // mainLoop: blank line between ticks (information+)
```

**Module ids** (for `Memory.log.modules`): `mainLoop`, `roomManager`, `spawnManager`, `harvester`, `upgrader`, `builder` (see `src/index.ts` and each file’s `LOG_MODULE`).

**`Memory` examples** (Screeps console; persists until changed):

```js
Memory.log = { default: "information" }; // typical: scope + CPU lines
Memory.log = { default: "error" }; // quiet
Memory.log = { default: "verbose" }; // + path
Memory.log = { default: "debug" }; // + debugLazy
Memory.log = { default: "error", modules: { harvester: "debug" } }; // one subsystem loud
delete Memory.log; // back to code defaults
```

More detail: **Logging conventions** in `AGENTS.md`, plus `src/roles/AGENTS.md` and `src/management/AGENTS.md`.

## Scripts

- `npm run build` — bundle to `dist/`
- `npm run typecheck` / `npm run lint` — quality checks
- `npm run deploy` — build and upload (requires Screeps credentials; see [`.env.example`](.env.example))

## CI and deploy

GitHub Actions builds (`npm run build`) then uploads `dist/main.js` via [`scripts/upload-screeps.js`](scripts/upload-screeps.js).

| Git branch | Workflow                     | Target                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`     | `.github/workflows/main.yml` | Official server: host `screeps.com`, in-game code branch `main`. Uses secret `SCREEPS_TOKEN`.                                                                                                                                                                                                                                                                                                                                                                 |
| `test`     | `.github/workflows/test.yml` | Community server: variable **`SCREEPS_TEST_HOST`** (hostname only, no scheme). Optional variables **`SCREEPS_TEST_PROTOCOL`** (often `http`) and **`SCREEPS_TEST_PORT`** (omit for port 80 with `http`; use `21025` if the API is on that port). Auth: secret **`SCREEPS_TEST_TOKEN`**, or secrets **`SCREEPS_TEST_USERNAME`** + **`SCREEPS_TEST_PASSWORD`**. Optional **`SCREEPS_TEST_BRANCH`** for the **Screeps editor** code branch (defaults to `test`). |

`SCREEPS_BRANCH` in CI is the branch tab in the Screeps code editor on that server, not the git branch name. Official releases: push or merge to `main`. Try changes on the community server by pushing to `test`. Upload script env: **`SCREEPS_PROTOCOL`** / **`SCREEPS_PORT`** (see [`.env.example`](.env.example)).

**Credentials and git:** never commit passwords, tokens, or `.env`. Use [GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) for CI. For local uploads, keep a gitignored `.env` (see [`.env.example`](.env.example)) or set environment variables in your shell only.
