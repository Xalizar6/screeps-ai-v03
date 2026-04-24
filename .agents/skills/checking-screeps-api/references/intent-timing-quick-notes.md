# Intent Timing Quick Notes

**Two goals (keep separate)** — full write-up: [`docs/agent-references/screeps-api.md`](../../../../docs/agent-references/screeps-api.md) (“Two goals”, action matrix, intent timing).

- Screeps actions queue **intents**; many effects apply at **end of tick** ([Game loop](https://docs.screeps.com/game-loop.html)).
- `Memory` writes are readable later in the **same tick**, but intent-driven game state changes still apply at tick boundaries.
- **Goal 1 — `creep.store`:** After `transfer` / `withdraw` / `pickup`, `creep.store` may not reflect the change in the same tick. Do not gate FSM transitions on immediate post-call store checks.
- **Safe default:** evaluate store-driven state transitions at the **top** of the handler pass (next effective observation after tick boundary).
- **Same-method precedence:** if the same method is called multiple times in one tick, the **last** call wins ([Simultaneous actions](https://docs.screeps.com/simultaneous-actions.html)).
- **Goal 2 — pipelines:** **Pipelines 1 and 2:** only the **rightmost** method in that pipeline runs for the tick. **Pipeline 3:** **several** methods can all run when official **energy** rules are satisfied; otherwise **rightmost** wins. See matrix in `screeps-api.md`.
- **CARRY snapshot:** simultaneous pipeline‑3 `CARRY` adjudication uses energy **at the beginning of the tick** (official docs)—not “script line order” or an updated `creep.store` mid-tick after you queued a `withdraw`.
- **Repo pattern:** adjacent controller-buffer `withdraw` + `upgradeController` same tick is allowed under pipeline‑3 rules; **still** follow goal 1 for any same-tick `store`-based branching.
- If same-tick pivot is required, use explicit pre-action deltas carefully and document the trade-off.
