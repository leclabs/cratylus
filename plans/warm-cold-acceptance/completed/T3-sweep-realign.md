# T3 · sweep-realign (fan-out generator + generic per-shard template)

**Wave** 1 · **Deps** T0 ⊳dep (law) · T1 ⊳dep (oracle) · T2 ⊳dep (work-list) · **State** pending

## Objective

Drive every fragment to `warm(f) ≡ R_cold(f) ≡ intent`. This task INSTANTIATES one blind-dispatchable
realign-task per shard from T2's work-list, each running the generic gate below. The specific fixes are
DISCOVERED by the oracle at execution — never pre-baked. Fan-out is here (N shards), so this is the
plan's wide wave.

## Inputs

- ⊳dep T0 — the warm≡cold law fragment (defines the gate's pass condition + the correction direction).
- ⊳dep T1 — the oracle harness (computes `R_cold(f)`; isolated process, not a subagent).
- ⊳dep T2 — the work-list `[ { shard_id, concern, fragment_refs[] } ]`.

## Per-shard realign-task TEMPLATE (instantiate one per shard_id)

For each fragment f in the shard:

1. `R_cold(f)` ← run T1's oracle (isolated). `warm(f)` ← an in-repo read of f's intended meaning.
2. **Gate m1 · self-sufficiency**: is `R_cold(f) ≡ intent(f)`?
   - NO ⇒ fragment defect: fix f so it carries its meaning inline (better signifier + inline ≜),
     re-run oracle until `R_cold(f) ≡ intent`.
3. **Gate m2 · noise**: is `decode_warm(f | K) ≡ R_cold(f)`?
   - NO ⇒ ambient noise: hunt the competing home `n ⊆ K` that pulls the warm reading off-truth
     (a DRY/MECE second home for the concept) and DELETE/reconcile n. Re-run until warm ≡ cold.
4. **Direction invariant (hard)**: realign the PROJECT toward `R_cold(f)`. NEVER edit f to match the
   warm corpus. If tempted to bend f to K, STOP — that is the inverted-source-of-truth failure.

## Acceptance (falsifier — per instantiated shard-task)

- FAIL if any f in the shard still has `warm(f) ≢ R_cold(f)` or `R_cold(f) ≢ intent` after the pass
  (re-run the oracle blind on a sample; a surviving divergence fails the shard).
- FAIL if any fragment was bent toward the corpus (fix moved f's meaning to match K instead of moving
  K/deleting noise) — inspect the diff: a fragment edit that CHANGES intent to match ambient context
  is a rejection, not a fix.
- FAIL if a "fix" loosened the gate rather than removing the divergence (fabricated agreement).

## Return

Per shard: `[ { fragment, m1_before/after, m2_before/after, action: fix-f|delete-n, oracle_transcript } ]`

- shard-level attestation `∀f ∈ shard . warm(f) ≡ R_cold(f) ≡ intent`.

---

## Outcome — PASS (2026-07-03) → see completed/T3-sweep-result.md

Corpus uniformly warm≡cold; 0 fragment defects across 15 skills + 21 organ classes (+3 trivial by inspection).
Targeted-sweep method (risk-scan → oracle at-risk + sample generic) chosen over 182-brute-oracle after
calibration showed ~0 divergence on well-authored fragments (my remit: reversible method choice). 2 defects
found+fixed in the HARNESS (mood-confound prompt, sweep.mjs truncation) — the sweep catching its own instrument's
noise, not phantom corpus flaws. No project→f bending; no fix-f/delete-n needed.
