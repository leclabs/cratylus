---
kind: principle
delineation: Before transforming an artifact you do not fully understand, capture its observable behaviour as a golden master pinned from the source itself, then accept the transformed target iff it reproduces that golden — the source-derived oracle, not a hand-written spec, is the equivalence criterion; the transform is correct exactly when the pinned behaviour survives it.
---

# Golden-Master Equivalence Oracle

Feathers' characterization testing generalized from "legacy code under test" to **any source→target transformation** — porting a framework, migrating a codebase, distilling a corpus.

The order is the discipline:

- **Generate the oracle before the transform, from the source** — downstream of the source, upstream of every transform pass. A golden written after, or from what the target _should_ do, pins assumptions, not preserved behaviour.
- **Acceptance is oracle-reproduction, not reviewer judgement** — mechanically decidable, the same stance under which a round-trip is property-tested rather than asserted ([[bidirectional-round-trip-fidelity]]).
- **Both artifacts are first-class; neither is a view of the other** — not projection ([[projection-is-not-the-source]]): two independent realizations, the golden the bridge that holds them equivalent.

The goldens are the **floor** ([[lossless-floor]]): pin the floor from the source, transform freely above it.

**Structural goldens and content-addressed staleness.** When the transform crosses paradigms and runtime semantics don't carry over, pin _structural_ invariants (props, slots, named outputs, data shape) — the only level at which "same artifact" stays meaningful. Tag each golden with the source it was pinned from (`sourceCommitHash`, `goldenGeneratedAt`): when the source moves the golden is stale and the transform stops trusting it — the hash _is_ the validity oracle, no human gate. **Capture once, project many** — one golden, one cheap replayable projection per target.

## See also

- [[bidirectional-round-trip-fidelity]] — the round-trip is the symmetric case (write∘read fixed point); the golden master is the one-way case (source behaviour survives a transform that has no inverse).
- [[lossless-floor]] — the goldens _are_ the declared floor: the captured behaviour the transform must preserve exactly, surplus above it free to change.
- [[verify-at-the-source-not-the-projection]] — the oracle is characterized from the artifact where behaviour is realized, not from a description of it; this is that stance applied to building the acceptance test.
- [[empirical-source-before-normative-doc]] — pin behaviour from what the source _does_, not from what its docs _say_ it does.
- [[self-application-is-mandatory]] — "the source reconstructs equivalent-or-better" is this oracle applied to the corpus itself.
