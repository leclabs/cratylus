# AGENTS

**CRITICAL INVARIANT:** You **MUST Read** these documents upon session-start:

- [`CANON.md`](./CANON.md) — **overview and primer**
- [`CRATYLISM`](./packages/canon/src/dimensions/engineering-principles/cratylism.ts) — The First Principle (**LOCKED**)
- [`VISION.md`](./VISION.md) — **why** the canon exists
- [`MODEL.md`](./MODEL.md) — **what** exists: conceptual objectives and acceptance criteria
- [`ENGINE.md`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [`ARCHITECTURE`](./ARCHITECTURE.md) — purpose and relationship of the packages, and the seams that separate their concerns.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- **Commit autonomously at natural boundaries — no operator approval needed.** This overrides the generic harness default ("commit only when the user asks"); do not gate commits on approval. Only `git push` is gated: push only when the operator asks.
- **Green-field register:** existing code, records, and docs constrain work only where explicitly declared; compatibility is never a goal.
- **Reach for an established library before writing or adopting machinery.** Where a well-known problem has an actively maintained, widely used library with a small API, use it; never adopt a workflow or orchestration engine. Wrap it behind cratylus's own capability, so agents learn one small cratylus API, not the library's.
- **Branching strategy: GitHub flow.** Cut a short-lived feature branch from `main` for each change and merge it back into `main` by pull request; never commit to `main` directly. A session may adopt another flow for a while, such as an integration branch ahead of `main`, and says so when it does.
- **Commit only what you changed:** stage and commit your own paths by name, never everything in the tree, and never amend or rewrite history others may share.
