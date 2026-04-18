---
name: checking-screeps-api
description: Validate Screeps API and runtime behavior before changing intents, return-code branches, same-tick store assumptions, action pipelines, or cached IDs. Use when the user mentions transfer/withdraw/pickup/harvest timing, creep.store, ERR_NOT_IN_RANGE or ERR_BUSY, moveTo, simultaneous actions, or Game.getObjectById.
---

# Checking Screeps API Behavior

Use this skill when implementation depends on exact Screeps runtime semantics.

## When to Use (Trigger Phrases)

- "intent timing", "same tick", "creep.store"
- "ERR_NOT_IN_RANGE", "ERR_BUSY", "return code"
- "transfer", "withdraw", "pickup", "harvest", "moveTo"
- "action result", "transition condition", "post-action check", "pipeline", "simultaneous"
- "Game.getObjectById", "cached id", "soft reference"

## Quick Workflow

1. Identify behavior-sensitive code paths (actions, transitions, return-code branches, multiple creep methods per tick).
2. Read **`docs/agent-references/screeps-api.md` first** (includes **action priority matrix** and intent timing).
3. Use the **Which canonical doc** map below for gaps.
4. Confirm uncertain API details in `https://docs.screeps.com/api/`.
5. Implement using safe patterns; document which rule/source you used.

## Which canonical doc (assumption → source)

| Topic                                               | Start here                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tick boundaries, when positions/stores update       | [Game loop](https://docs.screeps.com/game-loop.html) + `screeps-api.md`                                 |
| Multiple creep methods / pipelines / rightmost wins | [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html) + matrix in `screeps-api.md` |
| `Game` vs `Memory`, IDs, serialization              | [Global objects](https://docs.screeps.com/global-objects.html)                                          |
| Return codes, `console.log`, verifying outcomes     | [Debugging](https://docs.screeps.com/debugging.html)                                                    |
| `limit`, `tickLimit`, `bucket`, bursts              | [CPU limit](https://docs.screeps.com/cpu-limit.html)                                                    |
| World rules (rooms, sources, spawns)                | [Introduction](https://docs.screeps.com/introduction.html) + `screeps-overview.md`                      |

## Behavior-Sensitive Triggers

- `ERR_NOT_IN_RANGE`, `ERR_BUSY`, or other return-code handling.
- Transition logic immediately after `transfer`, `withdraw`, or `pickup`.
- Assumptions about same-tick state updates or **two+ dependent creep actions** in one tick.
- Any change using cached object IDs from memory.

## Human-in-the-Loop Checkpoint

Before finalizing, report:

- Which behavior rule was validated.
- Which source was used (`screeps-api.md`, `screeps-overview.md`, and/or canonical links above).
- What implementation guard was applied.

## References

- [verification-checklist.md](references/verification-checklist.md)
- [intent-timing-quick-notes.md](references/intent-timing-quick-notes.md)
