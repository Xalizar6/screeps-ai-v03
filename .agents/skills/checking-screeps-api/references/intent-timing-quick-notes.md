# Intent Timing Quick Notes

- Screeps actions queue **intents**; many effects apply at **end of tick** ([Game loop](https://docs.screeps.com/game-loop.html)).
- `Memory` writes are readable later in the **same tick**, but intent-driven game state changes still apply at tick boundaries.
- `creep.store` may not reflect `transfer` / `withdraw` / `pickup` changes in the same tick.
- **Safe default:** evaluate store-driven state transitions at the **top** of the handler pass (next effective observation after tick boundary).
- **Same-method precedence:** if the same method is called multiple times in one tick, the **last** call wins ([Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html)).
- **CARRY snapshot:** simultaneous `CARRY`-related methods each use energy available **at the beginning of the tick** (official docs; see `screeps-api.md` matrix section).
- **Pipelines:** dependent methods in one official pipeline → only the **rightmost** executes for that pipeline (unless pipeline 3 has enough energy for all — see matrix in `screeps-api.md`).
- If same-tick pivot is required, use explicit pre-action deltas carefully and document the trade-off.
