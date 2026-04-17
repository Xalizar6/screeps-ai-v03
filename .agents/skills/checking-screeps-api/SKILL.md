---
name: checking-screeps-api
description: Validate Screeps API behavior before changing intents, return-code branches, or same-tick store assumptions. Use when the user mentions transfer/withdraw/pickup/harvest timing, creep.store updates, ERR_NOT_IN_RANGE or ERR_BUSY handling, moveTo after action results, or cached ID resolution with Game.getObjectById.
---

# Checking Screeps API Behavior

Use this skill when implementation depends on exact Screeps runtime semantics.

## When to Use (Trigger Phrases)

- "intent timing", "same tick", "creep.store"
- "ERR_NOT_IN_RANGE", "ERR_BUSY", "return code"
- "transfer", "withdraw", "pickup", "harvest", "moveTo"
- "action result", "transition condition", "post-action check"
- "Game.getObjectById", "cached id", "soft reference"

## Quick Workflow

1. Identify behavior-sensitive code paths (actions, transitions, return-code branches).
2. Read `docs/agent-references/screeps-api.md` first.
3. Confirm uncertain behavior in canonical docs: `https://docs.screeps.com/api/`.
4. Implement changes using safe patterns for intent timing and soft references.
5. Document the verified behavior in the final explanation.

## Behavior-Sensitive Triggers

- `ERR_NOT_IN_RANGE`, `ERR_BUSY`, or other return-code handling.
- Transition logic immediately after `transfer`, `withdraw`, or `pickup`.
- Assumptions about same-tick state updates.
- Any change using cached object IDs from memory.

## Human-in-the-Loop Checkpoint

Before finalizing, report:

- Which behavior rule was validated.
- Which source was used (`screeps-api.md` and/or canonical API).
- What implementation guard was applied.

## References

- [verification-checklist.md](references/verification-checklist.md)
- [intent-timing-quick-notes.md](references/intent-timing-quick-notes.md)
