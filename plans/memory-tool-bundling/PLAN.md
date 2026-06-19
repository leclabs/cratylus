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
fixes the _packaging topology_ that rollout exposed. (Praxis sync owed on the parent plan:
`migrate-live-episodic` is now done.)

## Frontier

- **memory-home-dual-deploy** · **Mav** (machinery) + **Nico** (Protocol cell) — READY (both
  deps done). Promote `ideas/memory.md` → dir-form; resolve "one cell, two deploy fates"
  (project the verbatim Protocol into every SOUL **and** deploy as host `skills/memory/`
  carrying the `episodic` artifact). Nico cuts the Protocol edit naming the affordance.

## Backlog (pending)

- **wake-trigger-and-cutover** · **Mav** + **Nico** (wake cell) — deps:
  memory-home-dual-deploy. Nico edits `wake.md` for self-triggering per-host migration ("if
  `EPISODIC.md` exists and `.jsonl` does not, migrate first"). Deploy the culture to the
  fleet; remove the final package remnants. Dissolves the original cross-device trigger gap.

## Completed

- **skill-companion-deploy** · Mav — toolkit now deploys a skill's companion assets (dir-form
  cells + `assets:` front-matter + whole-dir placers). Golden master: 10 skills byte-identical,
  zero stray; `verify.py` PASS; `test_place.py` added.
- **episodic-toolsource-bundle** · Mav — `@leclabs/koine-episodic` retired (private `episodic`
  toolsource; lib fields + root tsconfig ref dropped); `tsup` bundles one dependency-free
  `dist/episodic.mjs`. 64/64 vitest green; `turbo build` green; `koine-` rename closed by
  retirement.
