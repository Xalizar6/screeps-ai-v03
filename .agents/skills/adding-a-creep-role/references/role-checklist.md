# Role Change Checklist

Use this checklist for new roles and FSM expansions.

## Files to touch

- `src/roles/<role>.ts`
- `src/types.d.ts`
- `src/index.ts` (role pass wiring, if needed)
- `src/management/spawnManager.ts` (if spawn priorities/population targets change)

## FSM and behavior

- Keep role-specific states, transitions, and handlers in the role file.
- Reuse `runFsm`, `transitionState`, and store helpers from `src/roles/fsm.ts`.
- Reuse `acquireEnergy` from `src/roles/energyAcquisition.ts` when energy behavior matches shared flow.

## Memory typing

- Extend `CreepMemory` for any new `state`, `targetId`, or role-specific fields.
- Avoid `any` for persistent memory contracts.
- Null-check all resolved IDs from memory before use.

## Logging

- Export `LOG_MODULE` as a stable module id.
- Keep information-level logs concise; use `path`/`debugLazy` for per-creep details.

## Verify

- Run `npm run fix`.
- Run `npm run build`.
- If using PowerShell 5.1, use:
  - `npm run fix; if ($LASTEXITCODE -eq 0) { npm run build }`
