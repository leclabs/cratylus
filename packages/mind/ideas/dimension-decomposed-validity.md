---
kind: principle
delineation: Correctness is the conjunction of N orthogonal sub-verdicts, one per concern-axis — decompose before writing any verifier, check each axis in isolation, AND-reduce. Yields locally-actionable reports and parallel-safe execution.
---

# Dimension-Decomposed Validity

Correctness is rarely one predicate; it is the **conjunction of N orthogonal sub-predicates**, one per concern-axis. Decompose the question along independent axes _before_ writing any verifier; verify each separately; combine. (Parnas's separation of concerns applied to the validation predicate.)

Orthogonality is load-bearing:

- **Locally actionable** — a failure carries an axis label; the fix lives in one concern; the other verdicts are unaffected and need not re-run.
- **Parallel-safe** — independent axes fan out and join; combining is an `AND` reduction.

The test: each axis can vary while the others hold fixed. Two axes that always move together are one axis double-counted; an axis that can't be stated without invoking another isn't independent — split, merge, or layer it. (The basis test of [[semantic-partition]], applied to correctness instead of knowledge.)

Per axis define: **anchor** (the concern, one sentence), **capture** (the cheap deterministic observation), **compare** (the pass relation), **report** (`{axis, expected, actual, evidence-coord}`). `PASS = ∀ axis . PASS`; one `FAIL` fails the whole, the `PASS`es still hold and need not re-derive.

## See also

- [[semantic-partition]] — the same orthogonality/basis cut, applied to correctness.
- [[false-positives-ship-bugs-stamped-absence]] — the verdict discipline each axis emits.
- [[tester]] — the archetype that runs the ladder.
