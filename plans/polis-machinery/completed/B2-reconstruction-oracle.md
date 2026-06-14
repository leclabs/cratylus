# B2 — reconstruction-oracle

**State:** completed (Mav) · **Lead:** Nico · **Phase:** B (machinery) · **Carried from:** markdown-ast-compose/05

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

## Outcome (Mav, 2026-06-14)

Per Nico's `≽ D` ruling (COORDINATION, 2026-06-14): **R1 + R2 mechanical, R3 an audit-line** (no
routing manifest exists — routing is in-the-loop in the exemplify run, never persisted). Soundness
over completeness: the oracle is a battery of necessary conditions, each violation a proof of
`¬accept(F)`; it never green-lights a provably-broken corpus, never claims to certify a clean one
semantically perfect.

- **`gate_reconstruct()`** in `toolkit/verify.py`, PASS-gated after `gate_roundtrip`.
  - **R1 — one-home totality.** Transitive `[[ ]]` closure from every composition root (agent + skill
    cells) → every reachable anchor resolves to exactly one home cell; a dropped dependency (no home) or
    a duplicated home FAILS, with the **reachability path** reported (root → … → drop) — the diagnostic
    a per-cell REFERENCES scan cannot give.
  - **R2 — cite-don't-copy.** A cell reproducing a contiguous 8-word run of another cell's definiens
    (delineation) **without citing** it FAILS; cite-and-echo is exempt (the home-citation is what makes
    R2 sound). Run length calibrated empirically: 8 is the most sensitive length at which the clean
    148-cell corpus is violation-free under the cite-exemption.
  - **R3 — completeness vs Δ.** Emitted as a visible audit-line NOTE (degrade-visibly), not mechanized.
- **`toolkit/test_reconstruct.py`** — the done-when oracle: a corrupted corpus FAILS (R1 dropped-dep,
  R2 uncited restatement), the cite-and-echo control is exempt, R3 surfaces as a NOTE, the clean corpus
  PASSES. Full mind suite green (6/6); repo build + test + lint green.
- **R3 follow-on (mechanize later):** make `resolve`/`exemplify` emit a routing manifest
  (source-span → home-cell); then R3 gates against it. Schema sketched for Nico in COORDINATION.
