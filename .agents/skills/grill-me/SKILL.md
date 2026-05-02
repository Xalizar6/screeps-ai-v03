---
name: grill-me
description: Interview the user relentlessly about a plan or design—including code, memory contracts, room/spawn management, and Screeps API behavior—until shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

## During the session

- **Terminology** — When the user uses fuzzy or overloaded terms, propose a precise reading and check it against root and nested `AGENTS.md` and relevant `docs/agent-references/` when the topic is API, roles, logging, or memory. Call out conflicts with those sources.
- **Scenarios** — For boundary-heavy decisions (spawn timing, FSM states, cache invalidation), offer one concrete tick-or-room scenario and ask what should happen.
- **Code vs claim** — If the user states how something works today, verify in the codebase when feasible; if it contradicts the claim, surface that before the next question.
- **ADR handoff** — When a settled branch is hard to reverse, cross-cutting, and trade-off-driven, suggest capturing it with the `architecture-decision-records` skill (`docs/decisions/`). Do not draft ADRs here unless the user asks.

## Attribution

See [references/ATTRIBUTION.md](references/ATTRIBUTION.md).
