# API Safety Reminder for Role Changes

Before changing role action behavior:

1. Read `docs/agent-references/screeps-api.md`.
2. If behavior is not explicit there, confirm with `https://docs.screeps.com/api/`.
3. Do not assume same-tick `creep.store` updates after intent-based actions.
4. Prefer transition checks at the top of handlers on the next tick when store timing matters.
