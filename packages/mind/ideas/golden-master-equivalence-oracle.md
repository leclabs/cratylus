---
kind: principle
delineation: Before transforming an artifact you do not fully understand, capture its observable behaviour as a golden master pinned from the source itself, then accept the transformed target iff it reproduces that golden — the source-derived oracle, not a hand-written spec, is the equivalence criterion; the transform is correct exactly when the pinned behaviour survives it.
---

# Golden-Master Equivalence Oracle

When transforming an artifact whose behaviour you cannot fully derive in advance — porting a framework, migrating a codebase, distilling a corpus — **pin its observable behaviour as a golden master from the source first, then accept the target only when it reproduces that golden.** The oracle is **characterized from the source**, not authored as an independent spec: you run the source, record what it does, and that record becomes the equivalence test the target must pass. This is Feathers' characterization testing generalized from "legacy code under test" to **any source→target transformation**: the source is its own specification, and equivalence is decided against captured behaviour rather than against intent.

The move has a fixed order, and the order is the discipline:

- **Generate the oracle before the transform, from the source.** A golden written after the transform, or written from what the target _should_ do, tests your assumptions, not the preserved behaviour. Capture invariants from the source while it is still the only ground truth — the oracle is downstream of the source and upstream of every transform pass.
- **Acceptance is oracle-reproduction, not reviewer judgement.** The target is correct exactly when it reproduces the golden; a transform that breaks a golden has changed behaviour, full stop. This makes equivalence **mechanically decidable** instead of a matter of trust — the same reason a round-trip is property-tested rather than asserted ([[bidirectional-round-trip-fidelity]]).
- **Both artifacts are first-class; neither is a view of the other.** Source-to-target transformation is _not_ projection: a projection is a derived view of one canonical source ([[projection-is-not-the-source]]), but here source and target are two independent realizations and the golden is what holds them equivalent. The oracle is the bridge that lets the target stand on its own while provably preserving what the source did.

The golden masters are the **floor** of the transform: the slice of behaviour the transform promises to preserve exactly, captured up front ([[lossless-floor]]). Behaviour above that floor is unpinned and may legitimately change; behaviour on it must round-trip. Pin the floor from the source, transform freely above it.

**Structural goldens and content-addressed staleness.** When the transform crosses paradigms and runtime semantics don't carry over, pin _structural_ invariants (props, slots, named outputs, data shape) rather than behaviour — the structural lift is then the only level at which "same artifact" stays meaningful. Tag each golden with the source it was pinned from (`sourceCommitHash`, `goldenGeneratedAt`): when the source moves the golden is stale and the transform stops trusting it — the hash _is_ the validity oracle, no human gate. **Capture once, project many** — one golden, one cheap replayable projection per target.

## See also

- [[bidirectional-round-trip-fidelity]] — the round-trip is the symmetric case (write∘read fixed point); the golden master is the one-way case (source behaviour survives a transform that has no inverse).
- [[lossless-floor]] — the goldens _are_ the declared floor: the captured behaviour the transform must preserve exactly, surplus above it free to change.
- [[verify-at-the-source-not-the-projection]] — the oracle is characterized from the artifact where behaviour is realized, not from a description of it; this is that stance applied to building the acceptance test.
- [[empirical-source-before-normative-doc]] — pin behaviour from what the source _does_, not from what its docs _say_ it does.
- [[self-application-is-mandatory]] — "the source reconstructs equivalent-or-better" is this oracle applied to the corpus itself.
