# T4 · ratify-commutation

**Wave** 2 · **Deps** T3 ⊳dep (all shards swept) · **State** pending

## Objective

Verify the four-way commutation on a sample: operator + nico-outside + nico-inside + oracle all read
each sampled fragment to the SAME meaning. Confirms COMMUTUAL-UNDERSTANDING holds — all parties agree
by each equalling `R_cold` (the fixed point), not by pairwise negotiation.

## Steps

1. Draw a representative sample across shards (include high-noise fragments realigned in T3, AND the
   self-referential items: this plan's own law fragment [T0] and ≥1 of this plan's task-files —
   test case #0, the plan must satisfy its own criterion).
2. For each sampled f, collect: `R_cold(f)` (oracle, isolated), `interp_nico-inside(f)` (warm face),
   `interp_nico-outside(f)` (clean face), `interp_operator(f)` (operator confirmation).
3. Divergence = any party ≢ `R_cold(f)`.

## Acceptance (falsifier)

- FAIL if divergence count > 0 on the sample. Any divergence REOPENS a T3 shard-task for that
  fragment (reject-and-return; do not paper over).
- FAIL if the sample excludes the plan's own artifacts (the self-test must be in-sample).
- FAIL if agreement was reached by a party overriding the oracle (e.g. operator or a face asserting a
  reading the cold decode does not yield) — agreement is equality-to-oracle, not consensus-against-it.

## Return

The commutation table `[ { fragment, R_cold, nico-in, nico-out, operator, ≡? } ]` + divergence count
(must be 0) + confirmation the plan's own artifacts passed cold-blind (test case #0 green).
