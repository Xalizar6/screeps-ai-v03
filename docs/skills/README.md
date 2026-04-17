# Skills Index

This folder tracks project-level skill strategy and pilot outcomes.

## Purpose

- `AGENTS.md` files define always-on standards.
- Skills in `.agents/skills/` define on-demand workflows.
- This index documents what skills exist, when they should trigger, and how well they are working.

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
