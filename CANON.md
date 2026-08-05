# CANON

## The First Principle:

[`Cratylism`](./packages/canon/src/dimensions/engineering-principles/cratylism.ts)

## High Altitude Mental Model:

The apex triad that must stay mutually consistent:

- [`CRATYLISM`](./packages/canon/src/dimensions/engineering-principles/cratylism.ts) — The First Principle (**LOCKED**)
- [`VISION`](./VISION.md) — **why** the canon exists
- [`MODEL`](./MODEL.md) — **what** a canonical primitive is

On inter-artifact conflict, reconcile **up** the order - revise
**MODEL**, _surface_ a **VISION** conflict (never unilaterally edit it), reconcile toward **cratylism**.
All derived Art must be consistent with the triad.

## High Altitude Conceptual Design:

- [`ENGINE`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [`ARCHITECTURE`](./ARCHITECTURE.md) — purpose and relationship of the packages

## Signification-gate — the per-symbol probe round-trip

A skill canonizes only when every symbol it **declares** round-trips. The gate
(`packages/canon/src/toolkit/symbol-probe-gate.ts`, exercised by
`packages/canon/test/symbol-probe-gate.test.ts`) realizes ENGINE's `signify-verify`: for each
declared symbol `w`, the concept the reader's priors circumscribe — `concept_R(w)` at reader=LLM (the
`probe` skill) — must be the concept the block **assigns** `w` (its declaration gloss, its σ\* target). A
mis-signified symbol — priors circumscribing a **different** concept than assigned — **fails**. The corpus's
formal blocks are thereby the **symbolic-σ\* regression suite**: naming drift trips a red test.
