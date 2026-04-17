# Skills Index

This folder tracks project-level skill strategy and pilot outcomes.

Repo overview and contributor setup: [`README.md`](../README.md).

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
- **Purpose:** Validate Screeps API semantics before changing intents, return-code branches, or same-tick `creep.store` assumptions; use local notes then canonical API when unsure.
- **Typical prompt language:** `intent timing`, `same tick`, `creep.store`, `ERR_NOT_IN_RANGE`, `ERR_BUSY`, `transfer` / `withdraw` / `pickup`, `Game.getObjectById`.
- **Source:** [`.agents/skills/checking-screeps-api/SKILL.md`](../.agents/skills/checking-screeps-api/SKILL.md)

## Practice Routine

1. Start a **new Agent** chat for one focused task.
2. Describe the task in natural language; add **trigger phrases** from the catalog if you want stronger auto-invocation.
3. For role wiring or API-sensitive behavior, **manually invoke** `/adding-a-creep-role` and/or `/checking-screeps-api` before or at the start of the task.
4. Run `npm run fix` then `npm run build` (see [`AGENTS.md`](../AGENTS.md) for PowerShell chaining).
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

- `adding-a-creep-role`
  - Trigger terms: `new role`, `FSM state`, `wire role pass`, `CreepMemory`.
  - Goal: reduce missed cross-file wiring and keep role changes consistent.
- `checking-screeps-api`
  - Trigger terms: `intent timing`, `ERR_NOT_IN_RANGE`, `creep.store`, `same tick`.
  - Goal: force API behavior validation before changing action logic.

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
