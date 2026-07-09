# E1 — R1: relocate projection tooling agent-anatomy → agent-forge

**static:** `packages/agent-anatomy/src/toolkit/{project.ts, project-cli.ts, project-cli-codex.ts,
project-human.ts, project-human-cli.ts, project-targets.ts, project-targets-cli.ts, organ-docs.ts}` ·
`../census/C1-package-boundaries.md` · `../NORTH-STAR.md §1, §2 R1`.
**scope:** move these projection/build modules into `agent-forge` (a new `forge/src/projection/`); rewire
imports. They already import forge downward. OUT of scope: the accept-gate (E2), the hook-lift (E4).
**accept (falsifier):** the modules live under `packages/agent-forge/src/`; `agent-anatomy/src/toolkit/` no
longer contains them; `git grep "projectHumanOrgan\|from '@leclabs/agent-forge/anatomy'" packages/agent-anatomy/src`
shows NO remaining projection VALUE-import (anatomy→forge is type-only for these); repo typecheck green; the
projection CLI output is unchanged (`project --check` / byte-compare the generated fixtures).
**dep:** none (foundational).
