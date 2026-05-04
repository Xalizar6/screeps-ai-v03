# 0002 — `clearPlan()` always resets `layoutApproved`

## Status

Accepted

## Date

2026-05-03

## Context

`planGenerator.ts` writes `room.memory.layoutPlan` but does not touch
`layoutApproved`. `layoutConstructor.ts` checks `layoutApproved === true`
before placing any construction sites.

This means if a player deletes `layoutPlan` (to force regeneration after
updating generation logic), `layoutApproved` persists in `RoomMemory`. The
next time the generator runs it produces a new plan, and the constructor
immediately starts placing sites from it — without the player reviewing the
new overlay.

The `xai.room.clearPlan()` console helper is the primary way players trigger
plan regeneration.

## Options Considered

### Option A: `clearPlan()` resets both `layoutPlan` and `layoutApproved`

- Pros: Enforces review before construction on every new plan. Matches the
  intended workflow: generate → visualize → approve → build.
- Cons: Slightly more friction if the player trusts the new plan immediately
  (requires a second `xai.room.approve()` call).

### Option B: `clearPlan()` deletes only `layoutPlan`, leaves `layoutApproved`

- Pros: Zero extra steps if the player wants to regenerate and auto-continue.
- Cons: Silent auto-approval of a plan the player has not reviewed. Defeats
  the purpose of the approval gate.

### Option C: `clearPlan()` accepts a flag (`keepApproval: true`)

- Pros: Opt-in convenience for the auto-approve case.
- Cons: Adds API surface and mental overhead; the unsafe behavior is too
  easy to reach accidentally.

## Decision

We choose **Option A**: `xai.room.clearPlan()` always deletes both
`layoutPlan` and `layoutApproved`, and returns a confirmation string that
tells the player approval was cleared.

Rationale:

1. The approval gate exists to give the player a review step before
   construction starts. Silently bypassing it on regeneration defeats its
   purpose.
2. The extra `xai.room.approve()` call is low friction compared to the risk
   of surprise construction from an unreviewed plan.
3. If the workflow proves too annoying in practice, we can add an opt-out at
   that time — reversing a "safe default" is easier than fixing unintended
   construction in a live room.

## Consequences

- Players must always call `xai.room.approve()` after `xai.room.clearPlan()`.
- The `xai.room.help()` output should document this pairing explicitly.
- If a future phase introduces automated plan regeneration (not player-triggered),
  that code must decide independently whether to clear or preserve approval;
  it should not rely on `clearPlan()`.
