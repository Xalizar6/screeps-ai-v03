---
name: extending-memory-schema
description: Extend CreepMemory, RoomMemory, SpawnMemory, or Memory.log typing safely. Use when adding fields to src/types.d.ts, persisting new IDs in Memory, or updating creepMemoryGc for dead creep cleanup.
---

# Extending Memory Schema

## Quick workflow

1. Add or adjust interfaces in `src/types.d.ts` (`CreepMemory`, `RoomMemory`, `SpawnMemory`, `Memory.log`, etc.).
2. Document which roles or managers read each new field.
3. Use typed `Id<...>` or string ids consistently with existing patterns.
4. If new creep memory keys need cleanup on death, check `src/management/creepMemoryGc.ts`.
5. Never use `any` for core memory contracts.
6. **Never store live game objects or functions** in `Memory` — only JSON-safe data; persist **`id`** strings and resolve with `Game.getObjectById` ([Global objects](https://docs.screeps.com/global-objects.html), `docs/agent-references/screeps-api.md`).

## References

- [soft-references.md](references/soft-references.md)

## Related skills

- `/checking-screeps-api` when behavior depends on intents or return codes tied to stored targets.
