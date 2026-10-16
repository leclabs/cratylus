# AGENTS

**CRITICAL INVARIANT:** You **MUST Read** these documents upon session-start:

- [`CANON.md`](./CANON.md) — **overview and primer**
- [`CRATYLISM`](./packages/canon/src/genus/prime-principle.ts) — The First Principle (**LOCKED**)
- [`VISION.md`](./VISION.md) — **why** the canon exists
- [`MODEL.md`](./MODEL.md) — **what** exists: conceptual objectives and acceptance criteria
- [`ENGINE.md`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [`ARCHITECTURE`](./ARCHITECTURE.md) — purpose and relationship of the packages, and the seams that separate their concerns.

## Working conventions

- Conventional Commits, header ≤100 chars (commitlint, `commit-msg` hook).
- **Commit autonomously at natural boundaries between gates, never past one.** This overrides the generic harness default ("commit only when the user asks"): between gates, commit without asking; at a gate, commit nothing past it until the operator signs it off. Pushing a branch and opening a pull request need no say-so.
- **Green-field register:** existing code, records, and docs constrain work only where explicitly declared; compatibility is never a goal.
- **Reach for an established library before writing or adopting machinery.** Where a well-known problem has an actively maintained, widely used library with a small API, use it; never adopt a workflow or orchestration engine. Wrap it behind cratylus's own capability, so agents learn one small cratylus API, not the library's.
- **Branching strategy: GitHub flow** (decision 0256). Each task gets a short-lived branch from `dev`, merged back into `dev` by pull request; for a release, `dev` is merged into `main` by pull request, and release is the operator's. Never commit to `dev` or `main` directly. A session may run an integration branch ahead of `dev` for one change, and says so when it does.
- **One check:** `pnpm check` builds, lints, typechecks and runs the deterministic tests, and fails when any of them fails. The `pre-push` hook runs it, and CI runs exactly it after checkout and `pnpm install`, with nothing before or after. Every dependency it needs is declared in the workspace's manifests; nothing checks what else is installed.
- **Tests cover cratylus's own deterministic code only** (decisions 0144, 0154): the check tests cratylus's code and the files it produces, never by starting omp, an agent or a model. Agent behaviour is judged in real use. The supported omp version is 18.10.2; the check neither needs nor starts omp, and after an omp upgrade the operator or the architect tries one real session by hand.
- **History is controlled by pull-request review** (decision 0153): no hook, CI step or command refuses a change to existing records; the concept journal and the ledger stay append-only because their verbs only append.
- **Commit only what you changed:** stage and commit your own paths by name, never everything in the tree, and never amend or rewrite shared history.
