# S4 · GATES-RETYPE — the cold-oracle gates consume forge's IR

**Objective.** Retype anatomy's cold-oracle gates (residue · structural-parsimony · accept) onto forge's
`SkillExpression`/`Skill` IR instead of the forked toolkit types, and un-gate the skill `description` from the
residue check (it is σ_human*, not σ*). The gates STAY in anatomy (they are the doctrine); only their input
type changes.

## Ground state (READ FIRST — deliberately-broken checkpoint)

- Branch `tmp-illustrate-conceptual-architecture`. HEAD `00d19f5` intentionally broken; realize the direction.
  Green reference = `7fd1c43`. push/deploy **Operator-reserved**.
- **Design decision (do NOT relitigate):** the gates live in **agent-anatomy**, not agent-forge. forge is
  doctrine-free and depends on nothing in anatomy; the cold-oracle IS the σ\* accept doctrine, so it stays an
  anatomy plugin-check that CONSUMES forge's IR. Do not move a gate into forge.

## Inputs

- `packages/agent-anatomy/src/toolkit/cold-oracle/{accept.ts, residue.ts, structural-parsimony.ts, oracle.ts}`
  — the gate legs; `cold-oracle.sh`, `sweep.mjs` the harness.
- `packages/agent-forge/src/anatomy/index.ts` — the IR to consume (`SkillExpression`, reshaped `Skill`).
- S1's reshaped IR ⊳dep. (Reads S2's migrated cells as gate _fixtures_, not as a code dep.)

## Constraints (design decisions)

0. **Forge dist is already fresh (S1 landed) — do NOT rebuild agent-forge.** A concurrent sibling shard (S2) is
   editing the same working tree; rebuilding forge's dist would race it. Consume `@leclabs/agent-forge/anatomy`
   (`SkillExpression`) from the current dist. Touch ONLY `cold-oracle/*` — S2 owns the skill cells in parallel.
1. **Retype onto forge's IR.** Wherever a gate imports the forked `SkillCell`/`SkillExpression` from
   `toolkit/skill-cell`, switch to forge's `anatomy/index.ts` types. The residue/parsimony/accept checks run
   over `formalBlock: SkillExpression` (the σ\* payload), typed — not string-scraped from a fence.
2. **Un-gate `description` (the E2a fix).** The skill `description` is σ_human*, NOT σ*. Remove it from the
   residue-gated field set — residue applies to `formalBlock`/`persona` (σ\*), never to a `description`. This
   reverses the prior over-gating.
3. **Per-field binding is the gate's contract:** σ* fields (organ value · skill `formalBlock` · agent
   `persona`) are residue/parsimony-gated; σ_human* fields (skill `description` · agent `description`) are not.
   Encode that field partition in the gate, not a per-file rule.
4. Keep the gate's semantics otherwise intact (cold-blind decode, the `COLD_ORACLE_LIVE=1` live path).

## Dependencies

- S1 (IR-RESHAPE) ⊳dep.

## Outputs

- Retyped gate legs importing forge's IR; `description` removed from the residue-gated set. A return naming
  each gate's new input type + the exact field-partition it now enforces (σ* gated vs σ_human* exempt).

## Acceptance (falsifier)

- FAIL if any `cold-oracle/*.ts` still imports `SkillCell`/`SkillExpression` from `toolkit/skill-cell` (forked
  type) rather than forge's `anatomy/index.ts`.
- FAIL if the residue gate still applies to the skill `description` field (grep the gated-field set).
- FAIL if a σ\* field (`formalBlock` / `persona` / organ value) is NOT in the residue-gated set (over-corrected).
- FAIL if `structural-parsimony`/`accept` string-scrape a fence instead of consuming the typed
  `SkillExpression`.
- FAIL if the return is human-register prose, not a dense structured mapping.
