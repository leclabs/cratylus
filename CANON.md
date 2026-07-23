# CANON

<!-- `ρ=human` -->

Use the `/help catalog` skill to project a readable catalog.

## Relationship

- [`VISION.md`](./VISION.md) — **why** the canon exists
- [`MODEL.md`](./MODEL.md) — **what** a canonical primitive is
- [`ENGINE.md`](./ENGINE.md) — **how** primitives are discovered, validated, and projected
- [`CANON.md`](./CANON.md) — the primitives themselves

**The prime principle — `cratylism`.** Everything in this repository derives from one ground axiom:
**cratylism** (names are natural, not conventional — VISION Thesis). A concept's canonical sign is an
intrinsic, **discoverable** property of the concept, found by cold verification, never coined by author or
operator. Therefore **all naming — anchors, dimensions, skills, agents, and the file/directory structure
itself — is discovered, never decided**, and the derived principles (`cold-decode-oracle` the verification
instrument, `llm-native` the LLM-reader application, σ\* the operation) follow from it. Naming is never a
preference to escalate; it is a fact to uncover.

**Apex + confidence order.** The apex triad that must stay mutually consistent: **cratylism** (the ground
axiom) · **VISION** (the purpose) · **MODEL** (the design). Confidence order — how firmly held, **not**
importance — is `cratylism ≻ VISION ≻ MODEL`: cratylism the most confident axiom, VISION the most important
**end**, MODEL the most revisable. On inter-artifact conflict, reconcile **up** the order — revise
**MODEL**, _surface_ a **VISION** conflict (never unilaterally edit it), reconcile toward **cratylism**.
Everything derived — cells · skills · agents · plans · SOUL — must be consistent with the triad.

## Signification-gate — the per-symbol probe round-trip

A skill canonizes only when every symbol it **declares** round-trips. The gate
(`packages/agent-canon/src/toolkit/symbol-probe-gate.ts`, exercised by
`packages/agent-canon/test/symbol-probe-gate.test.ts`) realizes ENGINE's `signify-verify`: for each
declared symbol `w`, the concept the reader's priors circumscribe — `concept_R(w)` at reader=LLM (the
`probe` skill) — must be the concept the block **assigns** `w` (its declaration gloss, its σ\* target). A
mis-signified symbol — priors circumscribing a **different** concept than assigned — **fails**. The corpus's
formal blocks are thereby the **symbolic-σ\* regression suite**: naming drift trips a red test.

**Independent-leg honesty.** The round-trip's semantic leg (`concept_R(w) = intended C`) is an LLM judgment;
the gate does **not** fake a deterministic oracle over it. It mechanizes the deterministic leg — extract each
declaration into a `⟨cell, symbol, assignedConcept⟩` obligation, then route **recorded** probe readouts to a
verdict — while the readout itself (the agent's `probe(w)` plus the match call) is authored externally and
supplied as data. An un-probed symbol routes to **`needs-probe`**, which does **not** pass: canonization is
withheld until an agent discharges the owed probe. Companion to `symbols.test.ts`, which binds decodability
(every fence glyph is a declared register member) rather than signification.
