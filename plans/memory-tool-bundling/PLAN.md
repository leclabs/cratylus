# memory-tool-bundling — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

The agent memory runtime (`episodic`: encode/read/migrate + the dream consolidation
engine) lives in a standalone, repo-bound package (`@leclabs/koine-episodic`) that **does
not travel to fleet hosts with the skills it serves** — the root cause of "migrate episodic
on another device has no clean trigger" (Operator, 2026-06-19). It was a CLI wearing a
library's clothes: zero TS importers, zero deps, serving only the memory rituals
(wake/dream/handoff + the ambient per-turn ENCODE in every SOUL). This plan **relocates the
runtime arm so it travels with its skill**: `episodic` becomes a bundled companion asset of
the `memory` organ, deployed to every host, with its tested TS kept in-repo as a build-only
origin.

Direction endorsed by the Operator. Culture seam ruled by Nico: `memory` is the organ-home,
not a 4th ritual; promote a cell to dir-form on-demand; anchors stay `memory` / `episodic`;
the npm package ceases to exist (discharging the long-owed `koine-` rename by deletion); the
SOUL Protocol names the affordance.

**Lineage.** Descends from `memory-model-redesign / migrate-live-episodic` (the md→JSONL
migration, rolled out fleet-wide — Mav canary + 11-agent fan-out, 2026-06-19). This plan
fixes the *packaging topology* that rollout exposed. (Praxis sync owed on the parent plan:
`migrate-live-episodic` is now done.)

## Frontier

- **skill-companion-deploy** · **Mav** — READY. Teach the toolkit to deploy a skill's
  companion assets (today `place_skills` copies only `SKILL.md`). 3 sites: `core/cells.py`
  reader (accept dir-form cells), `place/local.py` + `place/ssh.py` placers. Golden-master:
  the 11 existing skills deploy byte-identical.
- **episodic-toolsource-bundle** · **Mav** — READY (parallel). Retire
  `@leclabs/koine-episodic` as an npm package; keep its TS source + test suite as a private
  build-only origin; add an esbuild step → one dependency-free `episodic.mjs`. Correctness
  code (atomic `compact`, two-leg `assertNoLoss`) stays tested.

## Backlog (pending)

- **memory-home-dual-deploy** · **Mav** (machinery) + **Nico** (Protocol cell) — deps:
  skill-companion-deploy, episodic-toolsource-bundle. Promote `ideas/memory.md` → dir-form;
  resolve "one cell, two deploy fates" (project the verbatim Protocol into every SOUL **and**
  deploy as host `skills/memory/` carrying the `episodic` artifact). Nico cuts the Protocol
  edit naming the affordance.
- **wake-trigger-and-cutover** · **Mav** + **Nico** (wake cell) — deps:
  memory-home-dual-deploy. Nico edits `wake.md` for self-triggering per-host migration ("if
  `EPISODIC.md` exists and `.jsonl` does not, migrate first"). Deploy the culture to the
  fleet; remove the final package remnants. Dissolves the original cross-device trigger gap.

## Completed

_(none yet.)_
