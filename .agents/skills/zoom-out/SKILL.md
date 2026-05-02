---
name: zoom-out
description: Raise the abstraction layer and summarize how the current topic fits this repo — modules, callers, and Screeps domain terms (roles, FSM, tick entry, management, memory contracts). Use when you are unfamiliar with an area or need a concise map instead of parallel subagent onboarding.
---

<!-- Upstream used `disable-model-invocation: true`; not set here — Cursor does not apply that key consistently across environments. -->

# Zoom out

I don't know this area of code well. Step up one level of abstraction and give a concise map of the relevant pieces for **this Screeps AI codebase**.

Use this repo's vocabulary where it fits:

- **Tick entry and wiring** — `src/index.ts`, role pass order, `moduleScope` / logging
- **Roles and FSM** — `src/roles/`, per-role state machines, `src/roles/fsm.ts`, `CreepMemory.state` / `targetId` / `stateSinceTick`
- **Management** — `src/management/` (room cache, spawn, construction, shuttle demand)
- **Contracts** — `src/types.d.ts`, `Memory` shapes, `docs/agent-references/` when API or intent semantics matter

Name the key modules, who calls whom (or which tick phase owns what), and where to read next for the user's immediate question. Prefer a short structured outline over a wall of file paths.

## When to use something heavier

For full multi-area reconnaissance, use **`parallel-exploring`** or **`codebase-onboarding`** instead of this skill.

## Attribution

See [references/ATTRIBUTION.md](references/ATTRIBUTION.md).
