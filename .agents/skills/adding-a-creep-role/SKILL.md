---
name: adding-a-creep-role
description: Add or evolve a Screeps role with correct cross-file wiring across src/roles, src/types.d.ts, src/index.ts, and spawn integration. Use when the user mentions new role, role state, FSM transition, CreepMemory, targetId/stateSinceTick, role pass wiring, or upgrader/shuttle role behavior changes.
---

# Adding a Creep Role

Use this skill when role logic changes in `src/roles/`.

## When to Use (Trigger Phrases)

- "new role", "add role", "role behavior", "role refactor"
- "FSM state", "state transition", "state machine"
- "CreepMemory", "targetId", "stateSinceTick", "memory fields"
- "wire role pass", "update src/index.ts", "spawn role target"
- "upgrader", "shuttle", "builder", "harvester", "repairer" role updates

## Quick Workflow

1. Implement or update the role module in `src/roles/`.
2. Ensure role FSM state transitions remain inside the role file.
3. Update memory typing in `src/types.d.ts` for new role/state fields.
4. Wire the role pass in `src/index.ts` if this is a new role entrypoint.
5. Export a stable `LOG_MODULE` and follow logging conventions.
6. When intents, store timing, or **multiple creep actions per tick** matter, use `/checking-screeps-api` and `docs/agent-references/screeps-api.md` (action priority matrix).

## Required Checks

- Use shared helpers from `src/roles/fsm.ts` and `src/roles/energyAcquisition.ts` where appropriate.
- Do not rely on same-tick `creep.store` updates after `transfer`/`withdraw`/`pickup`.
- Do not combine **two dependent actions from the same official pipeline** in one tick unless the **rightmost** outcome is intentional ([Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html), matrix in `screeps-api.md`).
- Keep per-creep verbosity in `path`/`debugLazy`; avoid noisy information-level spam.
- Ensure any new memory IDs are treated as soft references (`Game.getObjectById` + null checks).

## Documentation upkeep

After wiring a new role or modifying an existing one, check:

- [ ] `src/roles/AGENTS.md` — update the **Current files** table if a new role file was added.
- [ ] `README.md` — update the **Repo layout** tree and the **Current capabilities** table if the role changes what the bot can do.
- [ ] `src/management/spawnManager.ts` — update body template comment and census rationale for the new role.
- [ ] `docs/agent-references/gameplay-strategy.md` — update spawn priority order or economy flow if the role changes it.

## Human-in-the-Loop Checkpoint

Before finalizing, summarize:

- Which files changed and why.
- Any state or memory schema additions.
- Any Screeps API behavior assumptions verified.

## References

- [role-checklist.md](references/role-checklist.md)
- [api-safety-reminder.md](references/api-safety-reminder.md)
