---
name: screeps-management-change
description: Change room, spawn, cache, or construction coordination in src/management with correct boundaries and memory typing. Use when editing roomManager, roomCache, structureCache, spawnManager, roomConstruction, shuttle demand, or RoomMemory fields.
---

# Screeps Management Change

Use when working under `src/management/`.

## Quick Workflow

1. Keep per-creep FSM logic in `src/roles/`; management coordinates room/spawn-level decisions only.
2. Prefer a single room pass: compute or cache once per tick, then consume downstream.
3. Extend `RoomMemory` / `SpawnMemory` in `src/types.d.ts` for new persisted fields.
4. Treat stored IDs as soft references: `Game.getObjectById` + null checks.
5. Export stable `LOG_MODULE` and follow `src/logging/AGENTS.md`.

## References

- [checklist.md](references/checklist.md)
- `docs/agent-references/screeps-api.md` (room queries, CPU bucket, soft references)
- `docs/agent-references/screeps-overview.md` (gameplay assumptions, data flow)

## Documentation upkeep

After a management change, check:

- [ ] `src/management/AGENTS.md` — update the **Current modules** table if a new file was added or a module's responsibility changed; update the **Execution order** section if the call order in `roomManager.ts` changed.
- [ ] `README.md` — update the **Repo layout** tree if new files were added; update **Current capabilities** if behavior changed.
- [ ] `docs/agent-references/gameplay-strategy.md` — update spawn priority or economy flow if the change affects room/spawn policy.

## Human-in-the-Loop Checkpoint

Summarize which management modules changed, any new memory fields, and CPU/caching impact before merge.
