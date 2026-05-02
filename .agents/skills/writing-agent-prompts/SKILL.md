---
name: writing-agent-prompts
description: >-
  Write a well-structured, single-block Composer2 prompt for implementing
  a scoped feature or fix in this repo. Use when the user asks for a prompt
  to hand off to Composer2, a new chat, or a background agent — especially
  for roadmap phases, bug fixes, or management changes.
user-invocable: true
---

# Writing Agent Prompts

## When to use

- User asks for a prompt to hand off to Composer2 or a new session.
- Implementing a roadmap phase, a targeted fix, or a management change.
- Any task where scope control, documentation upkeep, and a human approval
  gate matter.

## Prompt structure

Write every prompt in this order:

1. **One-line goal** — what phase or fix, file scope.
2. **Context** — what already exists; what the agent should NOT re-implement.
3. **Scope** — exactly what to do; include algorithm sketches where fragile.
4. **Out of scope** — name files and features explicitly excluded.
5. **Standards** — @-mention `AGENTS.md` files and skills the agent must follow.
6. **Verify** — `npm run fix` then `npm run build`, on separate lines (PowerShell).
7. **When build passes** — summarize what changed for human review.
8. **Documentation upkeep** — paste the **Documentation upkeep checklist** below
   (always for management changes; for other work, trim bullets that do not apply).
9. **Human checkpoint** — structured PTR/live in-game verification steps (what to observe).

## Formatting rule

Put the **entire** prompt you produce inside **one** fenced code block so the
user can copy it in one action. When the prompt itself contains code examples,
use **4-space indentation** instead of nested fences — nested fences break the
outer block.

## Brevity rule

- **Target:** the handoff prompt should fit one Composer2 paste (roughly **100
  lines or fewer**).
- **Algorithms:** omit sketches unless logic is genuinely fragile or
  non-obvious; for routine work, a file path plus **one sentence** is
  enough.
- **Standards (section 5):** use **@-mentions only** — no prose explaining what
  each file or skill contains.
- **Documentation checklist:** drop bullets that clearly do not apply (e.g.
  skip `gameplay-strategy.md` for a pure bug fix with no spawn/economy
  impact).
- **Content:** prefer **file paths** over pasted implementation; the receiving
  agent should read the repo.

## Documentation upkeep checklist

For management changes, include applicable bullets only — drop any that
clearly do not apply to the task.

- `src/management/AGENTS.md` — update the **Current modules** table if a
  module's responsibility changed.
- `README.md` — update **Current capabilities** if behavior changed.
- `docs/agent-references/gameplay-strategy.md` — update spawn/economy flow if
  the change affects room or spawn policy; confirm and skip if unchanged.
- `docs/skills/README.md` — add a new skill to the **Skill Catalog** if a skill
  was created.

## References

- Root [`AGENTS.md`](../../../AGENTS.md) — **Documentation upkeep**
- [`screeps-management-change/references/checklist.md`](../screeps-management-change/references/checklist.md)
- [`building-skills-from-patterns/SKILL.md`](../building-skills-from-patterns/SKILL.md)

## Tips

- Paste repo paths to root `AGENTS.md` and any nested `src/.../AGENTS.md` files that bound the task.
- Point to skills by path (for example [`checking-screeps-api/SKILL.md`](../checking-screeps-api/SKILL.md)) so the receiving session loads them.
- Inside the single copyable block, use clear Markdown headings so the receiving agent can scan the structure.
