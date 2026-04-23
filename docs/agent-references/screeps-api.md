# Screeps API Notes (curated)

Source: `https://docs.screeps.com/api/`

This doc is **not** a full API mirror. It’s a curated set of API details and patterns that are frequently relevant while implementing behaviors in this repo. For **tick model, intents, and world state timing**, see [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html).

## Game loop and intents (scripting fundamentals)

From [Game loop](https://docs.screeps.com/game-loop.html):

- At the **start** of a tick, the world has a fixed snapshot (object positions, stores, etc.).
- During the tick, your `main` runs against that snapshot; **property changes from your commands apply at the start of the next tick** (e.g. position after `move` is not updated same-tick for later code in the same tick).
- At **end** of tick, queued intents are applied; conflicts are resolved by engine rules (see [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html)).
- **`Game.time`** is the global tick counter; the next tick begins only after all players’ scripts finish for the current tick.
- Runtime globals are **recreated each tick**; only **`Memory`** persists across ticks (see [Global objects](https://docs.screeps.com/global-objects.html)).

## Action priority matrix (simultaneous creep actions)

Canonical reference: [Simultaneous execution of creep actions](https://docs.screeps.com/simultaneous-actions.html) (includes `action-priorities.png`).

The following pipelines and rules match the official documentation (verbatim priority order left → right means **rightmost wins** when the same pipeline conflicts).

### Two goals (keep separate)

1. **Intent timing / `creep.store`:** Do not assume `creep.store` (or other intent-driven world state) updates **during** your script after you call `withdraw`, `transfer`, `pickup`, etc. Effects apply at **tick end**; see [Intent timing and `creep.store` within a tick](#intent-timing-and-creepstore-within-a-tick). This is **orthogonal** to pipeline rules.
2. **Same pipeline, multiple methods:** Know how **pipelines 1–2** differ from **pipeline 3**. Pipelines 1 and 2 always resolve to a **single** winning method (rightmost). Pipeline 3 may run **several** methods in one tick when the official **energy** conditions are met; otherwise pipeline 3 also falls back to **rightmost wins**. For simultaneous `CARRY` work in pipeline 3, adjudication uses the **beginning-of-tick** carry snapshot per official docs—not “whatever `creep.store` looks like after your earlier lines of code this tick.”

### Pipeline 1

`harvest` > `attack` > `build` > `repair` > `dismantle` > `attackController` > `rangedHeal` > `heal`

### Pipeline 2

`rangedAttack` > `rangedMassAttack` > `build` > `repair` > `rangedHeal`

### Pipeline 3

`upgradeController` > `build` or `repair` > `withdraw` > `transfer` > `drop`

### Rules

- **Pipelines 1 and 2:** Only the **most right** method in that pipeline executes for the tick, even if multiple methods in the same pipeline would return `OK`.
- **Cross-pipeline:** You may execute multiple methods by combining methods from **different** pipelines in one tick (including methods like `moveTo` that are **not** in the dependency pipelines above).
- **Pipeline 3:** If there is **enough energy** for all scheduled operations in that pipeline, **all** execute; otherwise a conflict arises and only the **most right** one executes.
- **Same method more than once:** The **last** call wins for that method (e.g. multiple `move` / `moveTo` — only the last movement intent applies).

### Project interpretation

- **Pipelines 1 and 2:** Treat multiple methods in the **same** pipeline as mutually exclusive for that tick: only the **rightmost** runs. Do not expect a “left” method and a “right” method both to apply.
- **Pipeline 3:** Multiple methods **can** all run in one tick when official rules say there is **enough energy** for the combined pipeline‑3 work; if not, only the **rightmost** runs. Combinations such as adjacent `withdraw` (buffer) then `upgradeController` are **not** disallowed by “same pipeline” alone—they follow the same official energy and conflict rules. **Still** do not branch FSM or capacity logic on **same-tick** `creep.store` after those calls (goal 1).
- Methods that return `OK` can still be **senseless** (e.g. heal full creep) and **block** more-left methods in the same pipeline per official docs.
- You cannot execute the **same** method type multiple times per tick for different targets where the docs forbid it (e.g. multiple `transfer` to different objects) — see official “Additionally” section.

### Carry snapshot

Simultaneous `CARRY`-related methods each see the energy available **at the beginning of the tick** (for how pipeline‑3 combinations are resolved); see [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html) and [Game loop](https://docs.screeps.com/game-loop.html). That is **not** the same as reading `creep.store` mid-script and assuming it already reflects a `withdraw` you just queued (see [Intent timing and `creep.store` within a tick](#intent-timing-and-creepstore-within-a-tick)).

## Frequently used globals

- `Game`
  - `Game.creeps`, `Game.rooms`, `Game.spawns`
  - `Game.time`
  - `Game.getObjectById<T>(id)` for resolving stored IDs
  - `Game.cpu.limit`, `Game.cpu.tickLimit`, `Game.cpu.bucket` — see [CPU limit](#cpu-limit-and-bucket) below

- `Memory`
  - Persistent JSON-like store.
  - Use typed interfaces in this repo (extend `CreepMemory`, `RoomMemory`, etc.).

## Global objects: `Game` vs `Memory`

From [Global objects](https://docs.screeps.com/global-objects.html):

- **`Game`** is built fresh each tick; mutating arbitrary properties on it does **not** persist game state — only **methods** on game objects enqueue real intents.
- **`Memory`** persists between ticks as JSON-serializable data (no functions, no live object references).
- **`Memory` writes are visible immediately within the same tick** (later code in the same script execution can read updated values), but game-object intent effects still resolve at tick boundaries.
- **Do not** store live game objects in `Memory`; store **`id`** strings and resolve with `Game.getObjectById`.
- **`Memory` is limited** (official cap 2 MB); keep payloads intentional.
- First access to `Memory` in a tick triggers parse cost (CPU charged to your script); keep reads/writes lean where hot.

## CPU limit and bucket

From [How does CPU limit work](https://docs.screeps.com/cpu-limit.html):

- **`Game.cpu.limit`:** Account baseline CPU ms per tick (depends on GCL / unlock, etc.).
- **`Game.cpu.bucket`:** Unused baseline under the limit rolls into a bucket (max **10,000**).
- **`Game.cpu.tickLimit`:** Effective ceiling for **this** tick — can exceed `limit` when bucket allows burst spend (up to **+500** from bucket when full, per docs).
- Use bucket-aware scheduling for **bursty** work (e.g. heavy `PathFinder` or one-off room scans): defer to ticks with headroom.

## Debugging

From [Debugging](https://docs.screeps.com/debugging.html):

- Use `console.log` for console output; check return codes (`OK` vs `ERR_*`).
- A return of `OK` does not guarantee the outcome you expected if the world changed or intents conflicted — verify on the **next** tick or with targeted logging / `Memory` watch keys.

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

This section is **goal 1** in [Two goals (keep separate)](#two-goals-keep-separate): same-tick **`creep.store`** vs **pipeline conflict rules** (goal 2) are different topics.

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
