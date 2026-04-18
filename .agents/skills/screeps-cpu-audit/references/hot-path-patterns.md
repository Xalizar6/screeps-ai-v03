# Hot path patterns

- **Room pass:** `roomManager` runs cache then construction; add shared data there instead of per-creep `find`.
- **Role pass:** fixed order in `src/index.ts`; keep per-creep work cheap; defer verbose logging to `path` / `debugLazy`.
- **Evidence:** raise `Memory.log` for a module to `verbose` / `debug` temporarily to see scope CPU lines.

See `docs/agent-references/screeps-overview.md` for tick and CPU context.
