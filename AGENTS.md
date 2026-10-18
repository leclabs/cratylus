# AGENTS

**CRITICAL:** Your **absolutely mandatory immediate next action is to read** @INTRODUCTION.md i.e. [`INTRODUCTION`](./INTRODUCTION.md) - source agnostic, voice neutral, conceptual foundation of the core principles.

**CRITICAL:** Use the concepts journal to bootstrap your semantic comprehension of the **authoritative conceptual model** per bounded domain.

## Working conventions

- **Green-field register:** existing code, records, and docs constrain work only where explicitly declared; compatibility is never a goal.
- **Reach for an established industry practice,** well-known solutions, and actively maintained community recommended libraries before creating bespoke software. Wrap it behind cratylus's own capability, so agents learn one small cratylus API, not the library's.
- **Branching: Git flow's `dev`/`main` split, without release or hotfix branches.** Each feature branch should branch from the local `dev` line, be short lived, and rejoin it's parent upon approval. 
Releases are initiated is a pull request from `dev` into `main`, and it is the operator's. Never commit to `main` directly.
- **One check:** `pnpm check` builds, lints, typechecks and runs the deterministic tests, and fails when any of them fails. The `pre-push` hook runs it, and CI runs exactly it after checkout and `pnpm install`, with nothing before or after. Every dependency it needs is declared in the workspace's manifests; nothing checks what else is installed.
- **Tests cover cratylus's own deterministic code only:** the check tests cratylus's code and the files it produces, never by starting omp, an agent or a model. Agent behaviour is judged in real use. The supported omp version is >=18.12.0; the check neither needs nor starts omp, and after an omp upgrade the operator or the architect tries one real session by hand.
- **Version history is controlled by review, not by refusal:** no hook, CI step or command refuses a change to existing records; the concept journal stays append-only because its verbs only append.
- **Conventional Commits:** header ≤100 chars (commitlint, `commit-msg` hook).
- **Commits must include a changeset:** `pnpm changeset --help`
- **Commit only what you changed:** stage and commit your own paths by name, never everything in the tree, and never amend or rewrite the shared version history.
- **Commit autonomously at natural boundaries:**
- All agents **MUST** complete **workspace hygiene** and **prune self generated cruft** at natural boundaries
