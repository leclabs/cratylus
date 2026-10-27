# AGENTS

**CRITICAL:** Your **absolutely mandatory immediate next action is to read** @INTRODUCTION.md i.e. [`INTRODUCTION`](./INTRODUCTION.md) - source agnostic, voice neutral, conceptual foundation of the core principles.

**CRITICAL:** Read the domain model in `design/model` (`purpose.md`, then each `context.md` and its concepts) as the **authoritative domain model** per bounded context.

## Working conventions

- **Branching:** feature branches branch from `develop`, are short-lived, and merge into `develop` locally, without a pull request. A release is a pull request from `develop` into `main`, and it is the product owner's.
- **One check:** `pnpm check` builds, lints, typechecks, runs the deterministic tests and runs the model check (`cratylus model check`), and fails when any of them fails. The `pre-push` hook runs it, and CI runs exactly it after checkout and `pnpm install`, with nothing before or after. Every dependency it needs is declared in the workspace's manifests; nothing checks what else is installed.
- **Tests cover cratylus's own deterministic code only:** the check tests cratylus's code and the files it produces, never by starting omp, an agent or a model. Agent behaviour is judged in real use. The supported omp version is >=18.12.0; the check neither needs nor starts omp, and after an omp upgrade the product owner or the business analyst tries one real session by hand.
- **Every example has its acceptance test:** an example in `design/model` is bound by the test titled `<context>/<concept>: <example name>`, unless it is marked judged in review; the model check fails for an example no test names and for a test naming an example the model does not have.
- **Version history is controlled by review, not by refusal:** no hook, CI step or command refuses a change to existing records.
- **Decisions of realization:** each standing one is a file of its own in `design/decisions/`.
- **Commits must include a changeset:** `pnpm changeset --help`
- **Major version 0:** every package stays in major version 0. While in 0.x, a breaking change is released as a minor bump; 1.0.0 is published only when the product owner decides the interface is stable.
- All agents **MUST** complete **workspace hygiene** and **prune self generated cruft** at natural boundaries
