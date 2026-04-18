# Parallel explore prompts for screeps-ai-v03

Use with `subagent_type: "explore"` (read-only). Adjust thoroughness as needed.

**Agent 1 — Tick and wiring**

> Map `src/index.ts`: main loop order, `moduleScope` usage, role pass sequence, imports of `LOG_MODULE`. Summarize how a single tick runs.

**Agent 2 — Roles and FSM**

> Summarize `src/roles/*.ts`, `fsm.ts`, `energyAcquisition.ts`: how FSM state is stored in `CreepMemory`, shared helpers, and how intent timing / action pipelines align with `docs/agent-references/screeps-api.md`.

**Agent 3 — Management**

> Summarize `src/management/*.ts`: room cache, spawn manager, construction, shuttle demand; where `RoomMemory` is written and read.

**Agent 4 — Types and memory**

> Summarize `src/types.d.ts`: `CreepMemory`, `RoomMemory`, `Memory.log` and how they relate to roles and managers.

**Agent 5 — Build, CI, deploy**

> Summarize `package.json` scripts, `scripts/build.js`, `scripts/upload-screeps.js`, `.github/workflows/*.yml`, and `.env.example` for local upload.

Synthesize into one onboarding doc (see main `SKILL.md` template); prefer `docs/` or project root only if the user agrees.
