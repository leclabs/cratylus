# CANON

## The First Principle:

[`Cratylism`](./packages/canon/src/dimensions/engineering-principles/cratylism.ts)

Its scope is the corpus's core agent dimension names and values: the cold-decode oracle decides signs only
for them, the terminology it was built to discover. Every other term is the industry's own, used as the
industry understands it, and nothing cratylus ships holds a consumer's own surfaces to the oracle.

## High Altitude Mental Model:

The apex triad that must stay mutually consistent:

- [`CRATYLISM`](./packages/canon/src/dimensions/engineering-principles/cratylism.ts) — The First Principle (**LOCKED**)
- [`VISION`](./VISION.md) — **why** the canon exists
- [`MODEL`](./MODEL.md) — **what** a canonical primitive is

On inter-artifact conflict, reconcile **up** the order - revise
**MODEL**, _surface_ a **VISION** conflict to the operator, who alone rules on it (never edit it unilaterally), reconcile toward **cratylism**.
All derived Art must be consistent with the triad.

## High Altitude Conceptual Design:

- [`ENGINE`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [`ARCHITECTURE`](./ARCHITECTURE.md) — purpose and relationship of the packages

## Signification-gate — the per-symbol probe round-trip

The gate (`packages/canon/tooling/symbol-probe-gate.ts`, exercised by
`packages/canon/test/symbol-probe-gate.test.ts`) realizes ENGINE's `signify-verify` for the symbols this
corpus's own skills **declare** in their formal blocks; it reaches no consumer's surface. For each declared
symbol `w` it raises one obligation: the concept the reader's priors circumscribe — `concept_R(w)` at
reader=LLM (the `probe` skill) — must be the concept the block **assigns** `w` (its declaration gloss, its
σ\* target).

The gate has two legs. The deterministic leg is mechanized: it extracts the obligations and routes recorded
probe readouts to a verdict — **pass**, **fail** (priors circumscribe a **different** concept than assigned),
or **needs-probe** (no readout is recorded, which is owed and never a pass). The judgment leg,
`concept_R(w)` equals the assigned concept, is an agent's probe, recorded as a readout; the gate never
computes it. A skill canonizes only when every symbol it declares has a recorded passing readout.

Nothing in the repository records a readout for the live corpus, so every declared symbol is owed today:
`symbol-probe-gate.test.ts` pins that the live corpus routes entirely to needs-probe, and convicts a
mis-signified symbol on fixtures that supply readouts. The same gate detects a symbol assigned different
concepts by different cells, the injectivity `signify` states; `symbol-altitude.test.ts` holds the recorded
judgment on each such divergence.
