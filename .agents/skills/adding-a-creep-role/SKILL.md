---
name: adding-a-creep-role
description: Add or evolve a Screeps creep role with correct cross-file wiring for FSM, memory typing, logging, and main loop integration. Use when creating a new role, adding role states, or modifying role behavior in src/roles.
---

# Adding a Creep Role

Use this skill when role logic changes in `src/roles/`.

## Quick Workflow

1. Implement or update the role module in `src/roles/`.
2. Ensure role FSM state transitions remain inside the role file.
3. Update memory typing in `src/types.d.ts` for new role/state fields.
4. Wire the role pass in `src/index.ts` if this is a new role entrypoint.
5. Export a stable `LOG_MODULE` and follow logging conventions.
6. Validate behavior assumptions against API notes when intents/store timing are involved.

## Required Checks

- Use shared helpers from `src/roles/fsm.ts` and `src/roles/energyAcquisition.ts` where appropriate.
- Do not rely on same-tick `creep.store` updates after `transfer`/`withdraw`/`pickup`.
- Keep per-creep verbosity in `path`/`debugLazy`; avoid noisy information-level spam.
- Ensure any new memory IDs are treated as soft references (`Game.getObjectById` + null checks).

## Human-in-the-Loop Checkpoint

Before finalizing, summarize:

- Which files changed and why.
- Any state or memory schema additions.
- Any Screeps API behavior assumptions verified.

## References

- [role-checklist.md](references/role-checklist.md)
- [api-safety-reminder.md](references/api-safety-reminder.md)
