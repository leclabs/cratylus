# t1 — design the plan-set-dynamics tier

## Objective

Design the plan-level lifecycle model for praxis, whole and coherent, and emit everything t2/t3 need to
realize it: the concept lattice, cold-verified anchors, the exact praxis.ts formal-block notation, the
mechanism approach, and the placement ruling. The design must give the residual `plan-retirement` prose a
formal home.

Cover all four sub-models:

1. **plan-level state machine** — the state set + transition function for a plan-as-whole
   (`in-development → active → landed → retired/archived`, names cold-discovered not assumed), parallel to
   but distinct from the task-level `States`/`next`. State how a plan's level relates to its tasks' states
   (e.g. all-tasks-completed ⇒ eligible-to-land).
2. **plan-set membership** — how `list`'s `℘(P)` partitions (in-scope vs retired/archived) and the churn
   operators (birth on `start`; exit on retirement). Define membership as a function of on-disk state, not
   a stored field (mirror the existing folder-as-state discipline).
3. **landing relation** — `plan ↔ landing-commit`, **derived on demand, never stored**; specify the
   derivation (how a plan's landing commit is computed from VCS on demand) and result-landing as the
   retirement trigger.
4. **retirement/archival** — retire a landed plan without losing it (archive semantics), replacing the
   informal `chore: retire N landed plans` dir-delete.

## Inputs (static — exist at authoring)

- `packages/canon/src/skills/praxis.ts` — the skill to extend; note the task-level machine (the
  design template) and the residual `-- plan-retirement …` line (L54) to formalize.
- `MODEL.md` — cold-verify: `Kind ≜ {fragment,agent,rule,skill,hook}` (L10). Plans are NOT a Kind; the tier
  is a praxis-skill construct. Confirm where (if anywhere) it touches ENGINE.
- `packages/canon/src/skills/formalize.ts` — the self-sufficient-formalism accept-gate every notation
  addition must satisfy (no prose gloss on a law/def).
- `packages/canon/test/formal-block-self-sufficiency.test.ts` — the gate praxis must pass once the
  residue formalizes (t3 will drive `ALLOW_LIST → ∅`).
- `packages/canon/src/skills/dream.ts` — the retired `AGENTS.md@node` sink; confirm no residual plan
  memory-role.
- `plans/` (this dir + siblings) — the on-disk layout: `PLAN.md` + state folders + `.owner`.
- `.scratchpad/signify-review-jul-22/` — residue background.
- The memory session-registry (`~/.claude/skills/memory/episodic.mjs session`) — `owner`/`live`/`occupied`.

## Constraints

- **cratylism ≻ VISION ≻ MODEL**: every name discovered by cold verification, never coined; reuse-over-mint.
- **Do NOT add a MODEL `Kind`** — Kinds are fixed; the tier is praxis-skill-level.
- **self-sufficient-formalism** for all emitted notation: declarations-above / laws-below, no prose gloss on
  a law/def line (it must pass the self-sufficiency gate).
- **derived-on-demand-never-stored** for the landing-commit relation — the design must not store the commit.
- Folder-as-state discipline: plan-level state should be a function of on-disk structure, consistent with
  how task-state = the folder a task-file sits in.
- This is a design/canon shard — its home register is nico's remit; the notation must be self-sufficient.

## Dependencies

none (wave 0).

## Outputs

- A design spec (a doc under `plans/plan-set-dynamics/` or `docs/`) containing: the concept lattice + the
  cold-verified anchors; the sub-model definitions (state machine, membership, landing, retirement).
- The **exact praxis.ts formal-block notation** to add (as a spec block, not yet applied — t3 applies it),
  including the formalization that retires the `plan-retirement` residue.
- The **mechanism approach** for t2 (where/how plan-level state, membership, archival, and on-demand commit
  derivation are realized on disk + in tooling).
- The **placement ruling** (praxis-skill vs ENGINE; explicitly not a Kind) with rationale.

## Acceptance (blind, falsifiable)

1. The design names the plan-level states + transition function as cold-verified anchors (not stipulated).
2. It defines the membership partition + churn operators as a function of on-disk state (no stored field).
3. It defines the landing relation as derived-on-demand and names result-landing as the retirement trigger.
4. It gives archival (retire-without-losing) semantics replacing the dir-delete.
5. It emits exact praxis.ts notation that is self-sufficient (would pass the self-sufficiency gate — no prose
   gloss on a law/def) and that formalizes the `plan-retirement` residue.
6. It states placement and does NOT introduce a MODEL `Kind`.
   Falsifier: any of 1–6 absent; or a stored commit; or notation with a prose gloss on a law/def; or a new
   Kind proposed.
