# Skills Index

This folder tracks project-level skill strategy and pilot outcomes.

Repo overview and contributor setup: [`README.md`](../README.md).

- Always-on agent baseline: [`AGENTS.md`](../../AGENTS.md). Relocated detail index: [`docs/agent-references/README.md`](../agent-references/README.md) (includes **Where former root `AGENTS.md` detail lives**). Full JSDoc rules: [`docs/agent-references/jsdoc-conventions.md`](../agent-references/jsdoc-conventions.md).

## Purpose

- `AGENTS.md` files define always-on standards.
- Skills in `.agents/skills/` define on-demand workflows.
- This index documents what skills exist, when they should trigger, and how well they are working.

## Skill Catalog (Current)

Slash commands use the skill `name` from each `SKILL.md` frontmatter (type `/` in Agent chat and pick the skill).

### `adding-a-creep-role`

- **Slash:** `/adding-a-creep-role`
- **Purpose:** Cross-file checklist for new or changed creep roles: FSM in `src/roles/`, `CreepMemory` / `src/types.d.ts`, role pass in `src/index.ts`, `LOG_MODULE`, spawn wiring when needed.
- **Typical prompt language:** `new role`, `FSM state`, `wire role pass`, `CreepMemory`, `targetId`, `stateSinceTick`, upgrader/shuttle role changes.
- **Source:** [`.agents/skills/adding-a-creep-role/SKILL.md`](../.agents/skills/adding-a-creep-role/SKILL.md)

### `checking-screeps-api`

- **Slash:** `/checking-screeps-api`
- **Purpose:** Validate Screeps runtime semantics: tick/intent model, **action priority matrix**, return codes, same-tick `creep.store`, `Game`/`Memory`, CPU bucket, debugging expectations. Read `docs/agent-references/screeps-api.md` first; use the skill’s canonical doc map, then `https://docs.screeps.com/api/` when needed.
- **Typical prompt language:** `intent timing`, `same tick`, `creep.store`, `pipeline`, `simultaneous`, `ERR_NOT_IN_RANGE`, `ERR_BUSY`, `transfer` / `withdraw` / `pickup`, `Game.getObjectById`, `Game.cpu.bucket`.
- **Source:** [`.agents/skills/checking-screeps-api/SKILL.md`](../.agents/skills/checking-screeps-api/SKILL.md)

### `screeps-management-change`

- **Slash:** `/screeps-management-change`
- **Purpose:** Room/spawn/cache/construction coordination under `src/management/` with correct boundaries and `RoomMemory` typing.
- **Typical prompt language:** `roomCache`, `spawnManager`, `roomManager`, `RoomMemory`, `shuttleDemand`, single room pass.
- **Source:** [`.agents/skills/screeps-management-change/SKILL.md`](../.agents/skills/screeps-management-change/SKILL.md)

### `managing-log-levels`

- **Slash:** `/managing-log-levels`
- **Purpose:** Tune `Memory.log` and understand logger levels, `LOG_MODULE`, and console recipes.
- **Typical prompt language:** `Memory.log`, `verbose`, `debugLazy`, `moduleScope`, per-module log level.
- **Source:** [`.agents/skills/managing-log-levels/SKILL.md`](../.agents/skills/managing-log-levels/SKILL.md)

### `building-and-deploying-screeps`

- **Slash:** `/building-and-deploying-screeps`
- **Purpose:** `npm run fix` / `npm run build`, Windows PowerShell chaining, upload/CI branch mapping, credential hygiene.
- **Typical prompt language:** `npm run build`, `upload`, `GitHub Actions`, `main` branch, `test` branch, `.env`.
- **Source:** [`.agents/skills/building-and-deploying-screeps/SKILL.md`](../.agents/skills/building-and-deploying-screeps/SKILL.md)

### `extending-memory-schema`

- **Slash:** `/extending-memory-schema`
- **Purpose:** Extend `CreepMemory` / `RoomMemory` / `SpawnMemory` in `src/types.d.ts` and related GC or soft-reference patterns.
- **Typical prompt language:** `types.d.ts`, new memory field, `creepMemoryGc`, soft reference.
- **Source:** [`.agents/skills/extending-memory-schema/SKILL.md`](../.agents/skills/extending-memory-schema/SKILL.md)

### `screeps-cpu-audit`

- **Slash:** `/screeps-cpu-audit`
- **Purpose:** Check hot tick paths for `room.find` churn, `Object.values(Game.creeps)`, and caching opportunities.
- **Typical prompt language:** CPU, profiling, `room.find`, performance, hot loop.
- **Source:** [`.agents/skills/screeps-cpu-audit/SKILL.md`](../.agents/skills/screeps-cpu-audit/SKILL.md)

### `screeps-learning-loop`

- **Slash:** `/screeps-learning-loop`
- **Purpose:** Teach-as-you-go implementation style with TypeScript rationale and human checkpoints. Applies **Senior Screeps Architect + TypeScript Tutor** persona while the skill is active (see skill body).
- **Typical prompt language:** explain, learn, walk through, why this type, teaching mode (non-slash: use `/typescript-screeps-teach` for deeper-only).
- **Source:** [`.agents/skills/screeps-learning-loop/SKILL.md`](../.agents/skills/screeps-learning-loop/SKILL.md)

### `typescript-screeps-teach`

- **Slash:** `/typescript-screeps-teach` (manual only; `disable-model-invocation` in skill frontmatter)
- **Purpose:** Deeper tutor-style explanations for TS + Screeps in this repo.
- **Typical prompt language:** study, teach me, explain every line, tutorial pace.
- **Source:** [`.agents/skills/typescript-screeps-teach/SKILL.md`](../.agents/skills/typescript-screeps-teach/SKILL.md)

### `parallel-exploring`

- **Slash:** `/parallel-exploring`
- **Purpose:** Use parallel read-only explore subagents to map unfamiliar code quickly.
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/parallel-exploring/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/parallel-exploring/SKILL.md`](../.agents/skills/parallel-exploring/SKILL.md)

### `codebase-onboarding`

- **Slash:** `/codebase-onboarding`
- **Purpose:** Run parallel exploration then synthesize an onboarding doc (includes Screeps-specific prompts in `references/`).
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/codebase-onboarding/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/codebase-onboarding/SKILL.md`](../.agents/skills/codebase-onboarding/SKILL.md)

### `building-skills-from-patterns`

- **Slash:** `/building-skills-from-patterns`
- **Purpose:** Promote a repeated workflow into a new `.agents/skills/<name>/SKILL.md`.
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/building-skills-from-patterns/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/building-skills-from-patterns/SKILL.md`](../.agents/skills/building-skills-from-patterns/SKILL.md)

### `reviewing-code`

- **Slash:** `/reviewing-code`
- **Purpose:** Structured code review checklist (includes a short Screeps lens in the skill body).
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/reviewing-code/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/reviewing-code/SKILL.md`](../.agents/skills/reviewing-code/SKILL.md)

### `systematic-debugging`

- **Slash:** `/systematic-debugging`
- **Purpose:** Reproduce, isolate, hypothesize, verify debugging workflow.
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/systematic-debugging/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/systematic-debugging/SKILL.md`](../.agents/skills/systematic-debugging/SKILL.md)

### `auto-type-checking`

- **Slash:** `/auto-type-checking`
- **Purpose:** Typecheck after edits; includes `npm run typecheck` for this repo and optional Cursor hooks.
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/auto-type-checking/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/auto-type-checking/SKILL.md`](../.agents/skills/auto-type-checking/SKILL.md)

### `grill-me`

- **Slash:** `/grill-me`
- **Purpose:** Stress-test a plan or design with sequential probing questions.
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/grill-me/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/grill-me/SKILL.md`](../.agents/skills/grill-me/SKILL.md)

### `architecture-decision-records`

- **Slash:** `/architecture-decision-records`
- **Purpose:** Capture significant technical decisions as ADRs (suggested path `docs/decisions/`).
- **Attribution:** [references/ATTRIBUTION.md](../.agents/skills/architecture-decision-records/references/ATTRIBUTION.md)
- **Source:** [`.agents/skills/architecture-decision-records/SKILL.md`](../.agents/skills/architecture-decision-records/SKILL.md)

## Practice Routine

1. Start a **new Agent** chat for one focused task.
2. Describe the task in natural language; add **trigger phrases** from the catalog if you want stronger auto-invocation.
3. For role wiring or API-sensitive behavior, **manually invoke** `/adding-a-creep-role` and/or `/checking-screeps-api` before or at the start of the task. For management-only work use `/screeps-management-change`; for deploy/build use `/building-and-deploying-screeps`.
4. Run `npm run fix` then `npm run build` (see [`AGENTS.md`](../../AGENTS.md) for PowerShell chaining), or follow `/building-and-deploying-screeps`.
5. Optionally append a **Pilot Log** entry below with auto-invoked yes/no and what worked.

## When New Skills Are Added

Add a new `###` subsection under **Skill Catalog (Current)** (mirror the two skills above). The folder name and YAML `name` must match.

Template (copy and replace placeholders):

```markdown
### `your-skill-name`

- **Slash:** `/your-skill-name`
- **Purpose:** One line.
- **Typical prompt language:** comma-separated trigger phrases.
- **Source:** [`.agents/skills/your-skill-name/SKILL.md`](../.agents/skills/your-skill-name/SKILL.md)
```

## Pilot Skills (Phase 1)

Initial pilot exercised **`adding-a-creep-role`** and **`checking-screeps-api`** only; see **Skill Catalog** above for slash commands and triggers. Gate outcome is recorded under **Pilot Gate Review** below.

## Pilot Log

Use this template after each pilot-skill task:

```md
### YYYY-MM-DD - <task name>

- Skill used:
- Auto-invoked: yes/no
- False-positive invocation: yes/no
- Missed steps prevented:
- Token efficiency observations:
- Follow-up tuning:
```

### 2026-04-17 - Upgrader controller container energy

- Skill used: `adding-a-creep-role`, `checking-screeps-api`
- Auto-invoked: no
- False-positive invocation: no
- Missed steps prevented: Reused `RoomMemory.controllerContainerId` + `getObjectByIdOrNull` instead of per-creep `find`; avoided same-tick `creep.store` transitions after `withdraw` (handler entry uses `isStoreFull` only).
- Token efficiency observations: Short skill files pointed at workflow without needing full `references/` reads for this change.
- Follow-up tuning: none

### 2026-04-17 - Demand-based shuttle scaling for controller supply

- Skill used: `adding-a-creep-role`, `checking-screeps-api`
- Auto-invoked: no
- False-positive invocation: no
- Missed steps prevented: Room-scoped upgrader `WORK` sum + smoothed structure deficit for spawn targets; shuttle FSM uses `isStoreFull` / `isStoreEmpty` only at handler entry (no post-`transfer` store gates); `shuttleProfileId` + `deliverController` state wired in `types` / spawn memory.
- Token efficiency observations: Throughput model uses `RoomMemory` ids and `Game.creeps` scan (no per-tick pathing); `getUnfilledEnergyStructures` stays on existing structure cache.
- Follow-up tuning: Tune `SHUTTLE_BASE_ROUND_TRIP_TICKS` / caps from live metrics; extend `SHUTTLE_PROFILE_BODIES` when new shuttle bodies ship.

## Exit Criteria for Pilot

- Pilot skills auto-invoke reliably for expected prompts.
- No major conflict with `AGENTS.md` guidance.
- At least one avoided rework/missed step is documented.
- `SKILL.md` remains concise and detailed content stays in `references/`.

## Gate Review Template (Go/No-Go)

Run this after at least 2 uses per pilot skill.

```md
## Pilot Gate Review - YYYY-MM-DD

### Coverage

- adding-a-creep-role runs: <n>
- checking-screeps-api runs: <n>

### Metrics

- Auto-invocation hit rate: <percent> (target: >= 75%)
- False-positive rate: <percent> (target: <= 25%)
- Tasks with missed-step prevention: <n> (target: >= 1 total)
- AGENTS conflict incidents: <n> (target: 0 major conflicts)
- Token efficiency: PASS/FAIL
  - PASS definition: SKILL.md stayed concise and detailed guidance remained in references.

### Decision

- GO to full rollout / NO-GO

### If NO-GO, required fixes

- <description>
- <description>

### Owner sign-off

- Reviewer:
- Date:
```

## Gate Decision Rules

- **GO** when all targets are met and both pilot skills have at least 2 real runs.
- **CONDITIONAL GO** when only one target is missed but there are no major AGENTS conflicts; tune descriptions first.
- **NO-GO** when there is any major AGENTS conflict, or when two or more metric targets are missed.

## Pilot Gate Review - 2026-04-17

### Coverage

- adding-a-creep-role runs: 5
- checking-screeps-api runs: 6

### Metrics

- Auto-invocation hit rate: 0% (target: >= 75%) -> FAIL
- False-positive rate: 0% (target: <= 25%) -> PASS
- Tasks with missed-step prevention: 6 (target: >= 1 total) -> PASS
- AGENTS conflict incidents: 0 (target: 0 major conflicts) -> PASS
- Token efficiency: PASS
  - PASS rationale: `SKILL.md` remained concise and detailed guidance stayed in `references/`.

### Decision

- CONDITIONAL GO to full rollout.

### If NO-GO, required fixes

- Not applicable (decision is CONDITIONAL GO).

### Required follow-up for CONDITIONAL GO

- Operate `adding-a-creep-role` and `checking-screeps-api` as manual-first skills via slash invocation for safety-critical role/API work.
- Continue Phase 1 rollout without blocking on auto-invocation.
- Re-check auto-invocation behavior during monthly usage review after broader skill adoption.

### Owner sign-off

- Reviewer: xaliz
- Date: 2026-04-17
