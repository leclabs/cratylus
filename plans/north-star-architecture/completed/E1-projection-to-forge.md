# E1 — R1: relocate projection tooling agent-anatomy → agent-forge

**⛔ CLOSED — SUPERSEDED, not executed (2026-07-21, nico).** The aspirational composition-root decoupling this
shard names is now absorbed by **`plans/plugin-cli/` P1** (make agent-anatomy a plugin): once anatomy is a peer
plugin importing the forge core, the R1 "projection tooling in forge / anatomy value-import-free" end-state falls
out of the plugin boundary — no separate project-to-dir migration needed (plugin-cli DESIGN-BRIEF: "Supersedes
north-star's deferred E1"). Retained as the design record of the R1 rationale; do NOT dispatch — its intent lives
in plugin-cli P1/P2. The spec below is the ORIGINAL (superseded) text.

---


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
