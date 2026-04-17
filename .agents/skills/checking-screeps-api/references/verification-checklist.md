# Screeps API Verification Checklist

## Before coding

- Identify each behavior assumption in the target code.
- Mark whether each assumption is covered in `docs/agent-references/screeps-api.md`.
- For uncovered assumptions, verify against `https://docs.screeps.com/api/`.

## While coding

- Handle non-`OK` return codes explicitly.
- For soft references, guard `Game.getObjectById(...)` results against `null`.
- Avoid immediate store-based transitions after intent calls when timing is uncertain.

## Before finishing

- Include a short note about which behavior was verified and from which source.
- Confirm the final logic does not rely on undocumented same-tick side effects.
