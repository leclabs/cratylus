# AGENTS

**CRITICAL:** Your **absolutely mandatory immediate next action is to read** @INTRODUCTION.md i.e. [`INTRODUCTION`](./INTRODUCTION.md) - source agnostic, voice neutral, conceptual foundation of the core principles.

**CRITICAL:** Use the concepts journal to bootstrap your semantic comprehension of the **authoritative conceptual model** per bounded domain.

## Working conventions

- **Branching:** feature branches branch from `develop`, are short-lived, and merge into `develop` locally, without a pull request. A release is a pull request from `develop` into `main`, and it is the operator's.
- **One check:** `pnpm check` builds, lints, typechecks and runs the deterministic tests, and fails when any of them fails. The `pre-push` hook runs it, and CI runs exactly it after checkout and `pnpm install`, with nothing before or after. Every dependency it needs is declared in the workspace's manifests; nothing checks what else is installed.
- **Tests cover cratylus's own deterministic code only:** the check tests cratylus's code and the files it produces, never by starting omp, an agent or a model. Agent behaviour is judged in real use. The supported omp version is >=18.12.0; the check neither needs nor starts omp, and after an omp upgrade the operator or the architect tries one real session by hand.
- **Version history is controlled by review, not by refusal:** no hook, CI step or command refuses a change to existing records; the concept journal stays append-only because its verbs only append.
- **Commits must include a changeset:** `pnpm changeset --help`
- All agents **MUST** complete **workspace hygiene** and **prune self generated cruft** at natural boundaries
