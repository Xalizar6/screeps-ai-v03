# Management change checklist

## Boundaries

- Room-wide cache: `roomCache.ts` (`runRoomCache`); extend here for new room-scoped IDs (sources, containers, etc.).
- Orchestration: `roomManager.ts` calls cache then construction on cadence.
- Spawn logic: `spawnManager.ts` and spawn memory contracts in `types.d.ts`.
- Construction planning: `roomConstruction.ts` (split under `construction/` if it grows).

## Files often touched

- `src/management/<module>.ts`
- `src/types.d.ts` (`RoomMemory`, `SpawnMemory`)
- `src/index.ts` if main loop wiring changes

## Anti-patterns

- Embedding detailed per-creep behavior in management modules.
- Repeated `room.find` in hot inner loops without caching for the tick.

## Standards

- Full conventions: `src/management/AGENTS.md`
