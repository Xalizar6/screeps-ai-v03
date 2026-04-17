# Intent Timing Quick Notes

- Screeps actions queue intents and resolve at end-of-tick.
- `creep.store` may not reflect `transfer`/`withdraw`/`pickup` changes in the same tick.
- Safe default: evaluate store-driven state transitions at the top of the next handler pass.
- If same-tick pivot is required, use explicit pre-action deltas carefully and document the trade-off.
