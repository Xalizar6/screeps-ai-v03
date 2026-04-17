# External example codebases (curated)

These repositories are **not** part of this project. They are optional **examples** of how other players structure Screeps AIs. Use them for ideas, patterns, or vocabulary when researching a feature — not as something to copy verbatim into `screeps-ai-v03`.

## How to use this doc

- Prefer **targeted** exploration (a specific file or subsystem named in chat, or a URL to raw source) over assuming layout matches this repo.
- When porting ideas, **adapt** to this repo’s contracts: `AGENTS.md`, nested `AGENTS.md` files, per-role FSMs in `src/roles/`, logging in `src/logging/`, and typed memory in `src/types.d.ts`.

## Repositories

### bonzAI

- **URL:** `https://github.com/bonzaiferroni/bonzAI`
- **Notes:** TypeScript AI with an **Operation / Mission** style framework; useful for seeing how a larger modular codebase splits responsibilities across missions and shared utilities.
- **Caveat:** Architecture and conventions differ from this repo; treat as inspiration for structure and gameplay patterns, not a drop-in module.

### Overmind

- **URL:** `https://github.com/bencbartlett/Overmind`
- **Notes:** Large, mature TypeScript codebase (colony / directive / overlord style themes in its docs). Good for advanced automation, room coordination, and how a “full bot” organizes long-term behavior.
- **Caveat:** Very different surface area and abstractions than a minimal starter; copying snippets without adaptation will fight this repo’s FSM and logging standards.

### Screeps Nooby Guide (code from video series)

- **URL:** `https://github.com/Tim-Pohlmann/Screeps-Nooby-Guide`
- **Notes:** JavaScript tutorial code aligned with a **YouTube series**; strong for classic role files (`role.*.js`), prototypes, and incremental feature introductions.
- **Caveat:** Plain JS and older tutorial patterns; map concepts to TypeScript and this repo’s helpers rather than pasting prototype-heavy style unchanged.

## License and etiquette

- Respect each repository’s **license** and attribution if you reuse substantial logic.
- On the public MMO, running someone else’s bot **as-is** can affect other players; that is a gameplay/social choice outside this doc.
