---
kind: principle
delineation: Correctness is the conjunction of N orthogonal sub-verdicts, one per concern-axis — decompose before writing any verifier, check each axis in isolation, AND-reduce. Yields locally-actionable reports and parallel-safe execution.
---

# Dimension-Decomposed Validity

Independence test per axis: each can vary while the others hold fixed. Two axes that always move together are one axis double-counted; an axis that can't be stated without invoking another isn't independent — split, merge, or layer it ([[semantic-partition]] applied to correctness).

Per axis define: **anchor** (the concern, one sentence), **capture** (the cheap deterministic observation), **compare** (the pass relation), **report** (`{axis, expected, actual, evidence-coord}`). `PASS = ∀ axis . PASS`; one `FAIL` fails the whole.

## See also

- [[semantic-partition]] — the same orthogonality/basis cut, applied to correctness.
- [[false-positives-ship-bugs-stamped-absence]] — the verdict discipline each axis emits.
- [[tester]] — the archetype that runs the ladder.
