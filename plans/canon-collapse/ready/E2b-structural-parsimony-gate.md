# E2b · structural-parsimony-gate ⚡ FOUNDATION

**Slice** ENGINE · **Wave** 0 · **Deps** none · **State** ready · **Executor** mav (predicate specified below by nico)

## Why

The accretion this plan pays down (`base.ts`, `ResolvedAgent`, provenance mega-fragments) survived because
**parsimony-over-structure had no `accept()` leg**. A disposition without a gate binds attention, not the
corpus. This task adds the missing leg so the class cannot re-accrete.

## Objective

Add a machine-checked `accept()` leg (a test under `packages/agent-anatomy/test/` and/or the
`toolkit/cold-oracle/accept` legs) that FAILS on a file/type existing **solely to restate what an archetype
already holds**.

## Spec

- The predicate targets the standing counter-example class: (a) a shared "genus floor" module re-exported
  into every agent that carries no organ-selection of its own (the `base.ts` class); (b) a parallel
  `*Resolved` representation duplicating the `Agent` vector (the `ResolvedAgent` class); (c) an organ
  value-fragment whose content is wholly absorbed into an agent archetype (the provenance-mega-fragment
  class — a value cell referenced by exactly one agent and carrying identity, not a reusable organ value).
- Encode as a falsifiable structural check (import-graph / AST / reference-count based), not a lint of
  prose. State the predicate crisply in the test so a future reader can decide membership.
- The gate must currently RED on `base.ts`, `nicoResolved` (and peers), and the 9 provenance fragments —
  proving it bites — then GREEN once CLEANUP (C1) removes them.

## Acceptance (falsifier)

- FAIL if the gate is GREEN while `base.ts` / a `*Resolved` export / a provenance-mega-fragment still exists
  (a gate that does not bite its own motivating cruft is not the gate).
- FAIL if the gate REDs on a legitimate reusable organ value (one referenced by ≥2 agents, or a genuine
  catalog member) — no false positives on real shared values (positive + negative control both required in
  the test).
- FAIL if the predicate is stated as unfalsifiable prose ("looks duplicative") rather than a decidable check.

## Return

The gate's home + the exact predicate + a transcript showing it REDs on the three cruft classes and GREENs
on a held-out legitimate shared organ value (the negative control).
