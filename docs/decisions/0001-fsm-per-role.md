# 0001 — FSM per role file vs global state machine

## Status

Accepted

## Context

Early in the project we needed a pattern for creep decision-making that would:

- Scale to multiple roles without becoming a tangled cross-role switch statement.
- Keep each role's logic readable and modifiable in isolation.
- Allow new roles to be added without touching existing role code.
- Persist cross-tick state cheaply via `Memory.creeps[name]`.

Two main approaches were considered:

## Options considered

1. **Per-role FSM (one FSM per role file)** — Each role file owns its state machine. States are a string union local to that file. Shared mechanics (store checks, state transition, cached ID resolution) live in a single `fsm.ts` helper module. The main loop dispatches by `creep.memory.role`.

2. **Global cross-role state machine** — One central module maps every `(role, state)` pair to a handler. All roles share one state enum and one dispatch table.

## Decision

**Option 1: per-role FSM.**

Rationale:

- **Isolation** — modifying the harvester FSM cannot break the upgrader FSM; each file is self-contained.
- **Readability** — a role file reads top-to-bottom as a short story of what that creep does.
- **Extensibility** — adding a new role is additive (new file + wiring in `index.ts`), not a change to a shared dispatch table.
- **Screeps fit** — Screeps roles are semantically independent units; there is no shared behavior that benefits from a unified state namespace across roles.

Shared mechanics that are genuinely cross-role (`transitionState`, `runFsm`, `isStoreFull`, `isStoreEmpty`, `getObjectByIdOrNull`, `resolveSource`) live in `src/roles/fsm.ts`. Role-specific logic stays in the role file.

## Consequences

- Each new role file must define its own state enum and `StateMap`.
- `src/index.ts` dispatches by `creep.memory.role` using a `switch` or lookup; adding a role requires updating that dispatcher.
- `src/roles/AGENTS.md` enforces the boundary: no role-specific logic in `fsm.ts`.
- The skill `/adding-a-creep-role` provides the cross-file checklist for new roles.
