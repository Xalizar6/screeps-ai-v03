# API Safety Reminder for Role Changes

Before changing role action behavior:

1. Read `docs/agent-references/screeps-api.md` (**action priority matrix**, intent timing, return codes).
2. For pipeline / multi-method-per-tick questions, confirm [Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html).
3. If API details are still unclear, confirm with `https://docs.screeps.com/api/`.
4. Do not assume same-tick `creep.store` updates after intent-based actions; prefer transition checks at the **top** of handlers when store timing matters.
