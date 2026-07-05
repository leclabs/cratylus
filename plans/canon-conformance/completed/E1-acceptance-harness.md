# E1-acceptance-harness

**canon-conformance** · **wave 0** (root — gates every slice) · **Deps** none · **Lane** Mav (infra) + Nico (semantics)

## Inputs (static)

- `packages/agent-anatomy/src/toolkit/cold-oracle/` · `packages/agent-anatomy/test/reader-density.test.ts` · `MODEL.md`

## Objective

Lift the author-time gate from register-only to the full `accept() = Universal ∧ (agent⇒COMPOSED)`, decided by a
**BLIND cold-oracle** — LLM-priors ONLY (fresh `/tmp`, no corpus/memory/root reads). Today only `register(a)=LLM`
(one leg of COLD-BLIND) is witnessed; without the rest, the slices have no falsifier.

## Method (candidate — not baked)

- `verify(f) ⇔ decode_cold(core f) = intent(f)`, driven through `toolkit/cold-oracle` at priors-only (the sign must
  resolve without the corpus loaded — corpus-dependence ⇒ not σ\*\_R).
- Static witnesses for the non-decode legs: `PARTITIONED` (concept→home index: `|home|=1 ∧ disjoint ∧ cover`),
  `SIGNIFIED` (each anchor blind-σ\*), `PARSIMONIOUS` (`body=⟨α,residue⟩`), `CANONICAL` (`¬orphan∧¬private∧¬palimpsest`),
  `REGENERABLE` (`Target=deploy(c)` ∧ `SelfAuthored∉Target`).

## Acceptance (falsifier)

- FAIL if a seeded defect of ANY `Universal` leg passes the gate (non-vacuous: one seed per leg, each convicted).
- FAIL if `verify` consults anything but the priors-only blind cold-oracle (no corpus/session context).
- FAIL if a ratchet pin can be added silently (explicit, shrink-only).

## Gate

Infra + gate-semantics in-remit; the enforced pre-land boundary push-GATED (Operator).

## Return

The extended gate + its non-vacuous per-leg seed suite + a green run over one already-conformant cell.
