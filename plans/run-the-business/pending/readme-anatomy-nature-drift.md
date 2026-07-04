# readme-anatomy-nature-drift — root README describes agent-anatomy with its retired material nature

**Lane** Nico (corpus/docs) · **Status** pending.

The root `README.md` still describes `agent-anatomy` by its **pre-consolidation** material nature —
stale against the current truth that `packages/agent-anatomy/AGENTS.md` and the root `AGENTS.md`
already carry. `README.md` is the user-facing surface; the drift is reader-visible.

Known stale locus (≥1; sweep for the whole class, don't fix only the spotted line):

- §"consolidation target" table, `agent-anatomy` row: _"Markdown + a Python toolkit; not an npm
  package."_ Current truth: a **TS workspace member** (`@leclabs/agent-anatomy`, dep
  `@leclabs/agent-forge`); organ values / agents / skills are typed modules under `src/` (the sole
  source), markdown is a **projection**; the Python `toolkit/` projector was **retired** (only the
  shell hooks `toolkit/{continuity,guardrail}` remain). agent-forge is the only projection+deploy
  machinery (`pnpm anatomy:project` / `anatomy:deploy`).

## Static

`README.md` (root) · ground truth to align to: root `AGENTS.md` (§Packages) + `packages/agent-anatomy/AGENTS.md`.

## Scope

Grep `README.md` for every description of agent-anatomy's material nature (`grep -niE
'python|toolkit|not an npm|markdown' README.md`) and align each to current truth. Purely
descriptive; no structural claim beyond what the two AGENTS.md already assert. Keep README
user-facing register (ρ=human) — it is not an anatomy fragment.

## Accept (falsifiers)

- No occurrence in `README.md` describes agent-anatomy as Python/markdown-only or "not an npm
  package"; the table row matches root `AGENTS.md` §Packages.
- `README.md` remains the sole edit (a doc-only change); no `.ts` source touched.
