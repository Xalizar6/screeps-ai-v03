# Screeps API Verification Checklist

## Before coding

- Identify each behavior assumption in the target code.
- Mark whether each assumption is covered in `docs/agent-references/screeps-api.md`.
- For gameplay/world assumptions (sources, spawns, rooms), check `docs/agent-references/screeps-overview.md` and [Introduction](https://docs.screeps.com/introduction.html) when needed.
- For uncovered assumptions, verify against the canonical page from the skill’s doc map or `https://docs.screeps.com/api/`.

## While coding

- Handle non-`OK` return codes explicitly.
- For soft references, guard `Game.getObjectById(...)` results against `null`.
- Avoid immediate store-based transitions after intent calls when timing is uncertain.
- If scheduling **multiple creep actions** in one tick, check the **action priority matrix** in `screeps-api.md` — same pipeline → only the rightmost wins (pipelines 1–2); pipeline 3 depends on energy; duplicate same method → last call wins ([Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html)).
- After changes, confirm outcomes **next tick** or with explicit logging when `OK` might still not match intent ([Debugging](https://docs.screeps.com/debugging.html)).

## Before finishing

- Include a short note about which behavior was verified and from which source.
- Confirm the final logic does not rely on undocumented same-tick side effects.
