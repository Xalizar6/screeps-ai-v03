# Soft references

- Store durable ids in memory when it saves repeated `find`.
- Resolve each tick with `Game.getObjectById(id)` and handle `null` (structure destroyed, creep dead, etc.).
- Clear stale ids in role or management logic when resolution fails.

See `docs/agent-references/screeps-api.md` and root `AGENTS.md` memory typing section.
