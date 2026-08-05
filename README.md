# Cratylus

> **A foundation model is not merely an engine to be instructed. It is a semantic space to be addressed.**

The discipline is **latent lexicography** — the descriptive lexicography of a foundation model's
latent vocabulary. Cratylus is its instrument. See [VISION §The discipline](./VISION.md#the-discipline).

<!-- THE ⊥ IS CLOSED. `semantic engineering` stood here until 2026-07-26, when a cold decode
     disconfirmed it against two established fields (ontology engineering / Semantic Web, and PLT
     formal-semantics engineering); the derivation returned ⊥ convergently and a definite
     description stood in, because under `cratylism` a sign is discovered or absent, never coined.
     It was found on 2026-08-05: `latent lexicography` for the discipline, `Cratylus` for the
     instrument. Both were admitted by the standard the placeholder was protecting — argmin over
     candidates, blind reverse decode, occupancy check — not by preference. The admitting
     evidence is VISION §The discipline. The prior ⊥ was measured on an isolated cold oracle —
     tool-less, project-blind, cwd outside the repo, harness env block stripped — whose positive
     control passed (coined tokens decoded as unestablished) and whose candidate-free negative
     control returned six distinct strings across eight runs, mode `semantic anchoring` at 3/8 and
     one model only, with both existence-question runs answering "no established term". Every
     candidate the oracle did produce then failed a reverse decode on discovery-not-authorship. -->

![thesis.png](./thesis.png)

## The problem

Prompt engineering asks _how should I describe this?_ Context engineering asks _what should
accompany the request?_ Both locate meaning in text the author writes, and both inherit the same
failure: prose is re-interpreted on every read. Iterate on it and it accumulates hedges, patches and
hidden assumptions — more context consumed, weaker specification.

## The inversion

A foundation model already holds dense, structured priors over the concepts you are trying to
express. For any such concept there exists a signifier that fires it most sharply — the one
minimizing the mismatch between what the token actually invokes and what you meant. That is a
**optimal-signifier**, and it is **discovered, not coined**.

|                         | asks                           | meaning comes from   |
| ----------------------- | ------------------------------ | -------------------- |
| prompt engineering      | how do I **describe** it?      | the author           |
| context engineering     | what should **accompany** it?  | the assembled window |
| **latent lexicography** | what is it **already called**? | **the model**        |

The consequence is a compiler, not a prompt library: **discover → verify → canonize → compose →
project**. The canon is source; every agent, skill and config is a deterministic projection of it.
Runtime prose stops being the definition and becomes the emitted representation.

This guarantees a **reproducible semantic specification** — deliberately not deterministic model
behavior, which would be a lie. Only one of those two uncertainties is reducible.

## The packages

| package                                   | concern                                                          |
| ----------------------------------------- | ---------------------------------------------------------------- |
| [`@cratylus/canon`](./packages/canon)     | **meaning** — the corpus of signified agents, skills and rules   |
| [`@cratylus/runtime`](./packages/runtime) | **mechanism** — capability ports and the runtime plugin contract |
| [`@cratylus/forge`](./packages/forge)     | **projection** — the deterministic map onto one harness          |
| [`@cratylus/schema`](./packages/schema)   | the shapes a corpus authors against                              |
| [`@cratylus/memory`](./packages/memory)   | a runtime capability: an episodic store + consolidation verbs    |
| [`@cratylus/invoke`](./packages/invoke)   | the run-time entry — ships the `cratylus-run` command            |

Two commands, because there are two DAGs: **`cratylus`** at build time, **`cratylus-run`** at run
time. [`ARCHITECTURE.md`](./ARCHITECTURE.md) explains why merging them would undo the seam.

## Status

**Pre-release. Nothing is published yet** and every version is `0.0.0`. The architecture's
load-bearing properties are enforced by a gate that reads the real import graph, and the projected
corpus is pinned by a render oracle (`pnpm oracle`) rather than by prose. Where the source diverges
from the intended architecture, [`ARCHITECTURE.md`](./ARCHITECTURE.md) says so in a ratchet table
that fails the suite when a breach is repaired without retiring its pin.

## Reading order

1. [`VISION.md`](./VISION.md) — **why**: the thesis, the inversion, the discipline
2. [`MODEL.md`](./MODEL.md) — **what** exists
3. [`ENGINE.md`](./ENGINE.md) — **how** anchors are discovered, validated and projected
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the packages and the seams between them
5. [`CANON.md`](./CANON.md) — the corpus itself

## License

MIT — see [LICENSE](./LICENSE).
