---
name: screeps-cpu-audit
description: Review hot tick paths for CPU-heavy Screeps patterns. Use when profiling Game.cpu, reducing room.find churn, auditing Object.values(Game.creeps), or optimizing role or management loops.
---

# Screeps CPU Audit

## Quick checklist

1. Search for repeated `room.find` inside inner loops; prefer one room pass or cached ids.
2. Prefer `Game.getObjectById` from stored ids over repeated searches when stable.
3. Avoid repeated `Object.values(Game.creeps)` in hot paths unless necessary.
4. Use `moduleScope` summaries at `information` level to spot per-pass CPU deltas in logs.
5. Align with root `AGENTS.md` CPU expectations.
6. For **bursty** expensive work, check `Game.cpu.bucket` / `Game.cpu.tickLimit` — defer heavy pathing or scans when the bucket is low ([CPU limit](https://docs.screeps.com/cpu-limit.html), **CPU limit and bucket** in `docs/agent-references/screeps-api.md`).

## References

- [hot-path-patterns.md](references/hot-path-patterns.md)
- `docs/agent-references/screeps-api.md` (CPU bucket section)
