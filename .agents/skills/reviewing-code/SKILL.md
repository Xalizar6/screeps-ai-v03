---
name: reviewing-code
description: Perform a thorough code review focused on correctness, maintainability, performance, and best practices.
---

# Code Review

Use this skill when the user asks for a code review, feedback on their code, or to check code quality.

## Steps

1. **Understand the change** — read the files or diff to understand what the code is supposed to do. Identify the scope (new feature, bug fix, refactor).

2. **Check correctness**

- Does the code handle edge cases (empty input, null, zero, negative numbers)?
- Are error states handled (try/catch, error boundaries, fallback UI)?
- Does async code handle race conditions, cancellation, and timeouts?
- Are there off-by-one errors in loops or array access?

3. **Check maintainability**

- Are functions focused on a single responsibility?
- Are variable and function names descriptive?
- Is there unnecessary duplication that should be extracted?
- Are magic numbers replaced with named constants?
- Is the code complexity reasonable (deeply nested conditionals, long functions)?

4. **Check performance**

- Are there N+1 query patterns in database access?
- Are expensive computations or API calls happening in render loops?
- Are large lists missing virtualization or pagination?
- Are there missing indexes for common database queries?
- Is memoization used appropriately (not over-applied)?

5. **Check type safety** (TypeScript projects)

- Are there `any` types that should be narrowed?
- Are function return types explicit for public APIs?
- Are union types handled exhaustively?

6. **Check runtime verification** (no automated test runner — verify in-game)

- Does the change produce observable, capturable output (log lines via `moduleScope` / `debugLazy`, `JSON.stringify(Memory.someKey)`, CPU readings, visual overlays)?
- Does the human checkpoint specify what output to capture and how (console command to run, what to look for)?
- Can the captured output be pasted back to an agent for validation, or is approval purely subjective observation?
- Does the checkpoint cover at least one edge or failure case, not just the happy path?
- **Reviewer action:** If capture instructions are missing, use a **Should fix** finding that
  **includes** drafted console commands, expected signals in the capture, and a paste-back
  snippet—not only a gap note.

7. **Provide feedback** — organize findings by severity:

- **Must fix**: bugs, security issues, data loss risks
- **Should fix**: performance issues, maintainability concerns
- **Nit**: style preferences, minor suggestions

For each finding, include the file, line, the issue, and a suggested fix.

## Notes

- Be constructive — explain _why_ something is a problem, not just that it is.
- Acknowledge what's done well, not just what needs fixing.
- Don't bikeshed on style issues that a linter/formatter should handle.

## Screeps-specific lens

When reviewing this repo, also check: intent timing and **action pipeline** assumptions (`docs/agent-references/screeps-api.md`), `Memory` typing, `LOG_MODULE` usage, and CPU-heavy `room.find` patterns per `AGENTS.md`.

## Attribution

See [references/ATTRIBUTION.md](references/ATTRIBUTION.md).
