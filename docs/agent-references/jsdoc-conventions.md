# JSDoc conventions (this repo)

Module-scope functions in `src/` should be documented so files read like a short tutorial. TypeScript uses JSDoc for tooling and readability; see the [TypeScript JSDoc reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html).

Root [`AGENTS.md`](../../AGENTS.md) requires at least a one-line summary for every module-scope function; this file spells out **minimum content**, **exceptions**, and a **shape** to copy.

## Minimum content

- **Summary** (required, one line): what the function does and when to call it (intent, not a line-by-line repeat of the body).
- **Second sentence** (optional): why it exists if the name alone does not answer that (e.g. “Split out so … can be unit-tested” or “Avoids duplicate `PathFinder` calls”).
- **Add `@param` and `@returns`** when argument meaning, units, or the return value (including `null`, booleans meaning success, or Screeps error codes) is not obvious from types and names alone.
- **Side effects**: mention in the summary or a `@remarks` line when the function touches **`Memory`**, creates construction sites, enqueues spawns, writes logs at information level, or mutates global `Game` state — readers need to know without reading the whole body.

## Scope

- **Every named function** declared at **module scope** (exported or private `function foo` / `const foo = () =>`) should have a **`/** ... \*/`** block **directly above\*\* the declaration.

## Exceptions

Inline callbacks passed to `.map` / `.forEach` / `sort`, and trivial accessors whose comment would only restate the identifier, may omit a block. **Not** exempt: helpers used by roles or room logic — document those.

## When behavior changes

Update JSDoc when behavior changes (same bar as code review).

## Shape (copy and trim tags you do not need)

```ts
/**
 * One-line summary: what this does and when to call it.
 * @param room Room being planned; caller must ensure …
 * @returns Whether the operation succeeded (`OK` path only).
 */
```

## Folder-specific emphasis

- **`src/roles/`** — State handlers and target resolvers should read top-to-bottom with clear summaries. See [`src/roles/AGENTS.md`](../../src/roles/AGENTS.md).
- **`src/management/`** — Construction and cache helpers should stay approachable for new readers. See [`src/management/AGENTS.md`](../../src/management/AGENTS.md).
- **`src/logging/`** — See [`src/logging/AGENTS.md`](../../src/logging/AGENTS.md).
