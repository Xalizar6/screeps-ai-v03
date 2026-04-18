---
name: managing-log-levels
description: Tune Memory.log defaults and per-module overrides for createLogger subsystems. Use when changing log verbosity, debugging a role or manager, or editing Memory.log or LOG_MODULE wiring.
---

# Managing Log Levels

## Quick workflow

1. Identify the `LOG_MODULE` string for the subsystem (see `src/index.ts` and each module’s export).
2. Set `Memory.log.default` and/or `Memory.log.modules[<id>]` in the Screeps console (persists until cleared).
3. Use `path` / `debugLazy` for deep traces; keep `information` quiet for per-creep spam.

## References

- [memory-log-examples.md](references/memory-log-examples.md)
- [logging-api-sketch.md](references/logging-api-sketch.md)

## Canonical rules

- `src/logging/AGENTS.md` — level table, `moduleScope` once per tick per pass, no ad-hoc `console.log` in hot paths.
