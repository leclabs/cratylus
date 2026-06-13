# B2 — reconstruction-oracle

**State:** ready · **Lead:** Nico · **Phase:** B (machinery) · **Carried from:** markdown-ast-compose/05

## Intent

Make the exemplify acceptance law *mechanical*. Today `accept(F) ⇔ reconstruct(F) ≽ D` is a manual
audit at the end of an exemplify run. This task turns it into a verify-stage oracle so projection is
*provably* faithful, not faithful-by-inspection — the precondition for letting other projects depend on
mind's projections.

## Context

- The law `accept(F)` already landed in `packages/mind/ideas/exemplify.md`; the one-home invariant
  `∀ idea ∈ meaning(D) : ∃! home(idea) ∈ F ∪ Δ` (added 2026-06-13) gives the oracle a concrete,
  checkable target.
- `packages/mind/toolkit/verify.py` already gates schema + references + fences + round-trip; the oracle
  extends it with a reconstruction check.

## Work

1. Define the operational form of `reconstruct(F)` — recompose D's meaning from the routed cells + Δ.
2. Implement the `≽` comparison (equivalent-or-better) as a gate; a dropped dependency claim or an
   under-reconstruction fails it. (The acceptance audit already catches dropped deps manually — encode that.)
3. Wire into `verify.py` as a PASS-gated stage.

## Done-when

- `verify.py` runs the reconstruction oracle; a deliberately-corrupted projection (dropped cell / lost
  dependency) FAILS the gate; a clean corpus PASSES.
- The previously-parked decomposition is no longer "until decomposition is routine" — it is routine now.
