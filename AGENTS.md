# AGENTS

Read @INTRODUCTION.md first: it states Cratylic context design, the theory every record in `design/model/` is written in.

Read the domain model in `design/model/` next, `purpose.md` and then each bounded context's `context.md` and its records: it holds what each term means in its bounded context, and it is the one source of meaning the work is judged against.

## Working conventions

- **Practice:** this project practises behaviour-driven development.
- **Branching:** feature branches branch from `develop`, are short-lived, and merge into `develop` locally. A release is a pull request from `develop` into `main`, and it is the product owner's.
- **One check:** `pnpm check` builds, lints, typechecks, runs the deterministic tests and runs the model check (`cratylus model check`), and fails when any of them fails. The `pre-push` hook runs it, and CI runs exactly it after checkout and `pnpm install`. Every dependency it needs is declared in the workspace's manifests.
- **Tests cover cratylus's own deterministic code:** the check tests cratylus's code and the files it produces; agent behaviour is judged in real use. The supported omp version is >=18.12.0; after an omp upgrade the product owner or the business analyst tries one real session by hand.
- **Every example has its acceptance test:** an example in `design/model` is bound by the test titled `<context>/<concept>: <example name>`, unless it is marked judged in review; the model check fails for an example no test names and for a test naming an example the model does not have.
- **Version history is controlled by review:** a change to existing records is judged in review.
- **Decisions of realization:** each standing one is a file of its own in `design/decisions/`.
- **Commits must include a changeset:** `pnpm changeset --help`
- **Major version 0:** every package stays in major version 0. While in 0.x, a breaking change is released as a minor bump; 1.0.0 is published only when the product owner decides the interface is stable.
- **Workspace hygiene:** at each natural boundary, an agent removes what it generated itself and the work no longer needs, such as scratch files, worktrees and merged branches, so the workspace holds only the work and what others have left in it.
