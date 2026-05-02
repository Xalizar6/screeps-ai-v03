# Gameplay Strategy (curated)

Current strategy assumptions for this AI. Update this file as the bot's capabilities evolve.
For world rules and official gameplay docs see [`screeps-overview.md`](screeps-overview.md) and
[Introduction](https://docs.screeps.com/introduction.html).

---

## Current phase: single-room economy (RCL 1–4)

The bot operates one room at a time. All decisions are scoped to the room in view.

### Energy economy

```
Source → (harvester parks at container) → Container
                                              ↓
                                          Shuttle → Spawn / Extensions
                                              ↓
                                          Shuttle → Controller container
                                              ↓
                                         Upgrader → Controller
```

- **Harvesters** mine at the source and fill the adjacent container. One per source.
  If no shuttles exist yet, harvesters deliver directly to spawn (emergency mode).
- **Shuttles** move energy from containers to structures (spawn, extensions, controller
  container). Population is demand-driven via `shuttleDemand.ts`.
- **Upgraders** withdraw from the controller-adjacent container and upgrade.
  Target count: 3 (hardcoded; scales body size as RCL grows — _not yet implemented_).
- **Builders** acquire energy and build construction sites. Count: `ceil(sites / 3)`.
- **Repairers** acquire energy and repair structures below 50% hits. Count: `ceil(backlog / 3)`.

### Spawn priority order (current)

1. Harvesters (1 per source — highest priority; no harvesters = no income)
2. Shuttles (demand-based — needed before upgraders to move energy)
3. Upgraders (target: 3)
4. Builders (scaled to site count)
5. Repairers (scaled to repair backlog)

### Construction

Automated layout planning places roads, extensions, and towers based on RCL.
Construction sites are placed every 100 ticks (`CONSTRUCTION_PLAN_INTERVAL`).
See [`docs/roadmaps/room-layout-automation.md`](../roadmaps/room-layout-automation.md) for the full plan.

---

## Future phases (planned)

- **RCL 5–6:** Storage + links; reshape energy routing (harvesters → link → storage → upgraders).
- **Remote mining:** send harvesters to adjacent rooms; defend with towers.
- **Multi-room expansion:** claim/reserve new rooms; inter-room logistics.

See [`docs/agent-references/README.md`](README.md) for planned reference docs.
