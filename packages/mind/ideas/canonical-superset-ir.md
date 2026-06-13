---
kind: concept
delineation: One strongly-typed canonical form of which every target dialect is a projection — translate dialect-to-dialect through the superset, never pairwise, and the round-trip floor is the intersection of all targets' capabilities.
---

# Canonical Superset IR

When N tools speak N dialects of the same thing, the scaling answer is **not** N² pairwise translators — it is **one strongly-typed canonical form** (an intermediate representation) of which every dialect is a **projection**. You translate dialect → IR → dialect; each tool needs only its own read/write to the canonical center. This is the compiler's IR play applied to any translation domain (config, schema, document formats).

Two properties make the center honest:

- **The IR is the superset.** It carries the union of what any dialect can express; the richest dialect's form is usually the canonical shape. A canonical **vocabulary** (one shared name per concept, dialect-native names mapped onto it) is the same move at the term grain.
- **The lossless floor is the intersection** ([[lossless-floor]]). A round-trip is byte-faithful only across the intersection of all targets' capabilities; anything the IR holds beyond a given target's reach is lossy by construction and must surface explicitly.

A projection of the IR is never the IR ([[projection-is-not-the-source]]): the canonical form generates the dialects; the dialects are not abstracted back up into it.

## See also

- [[bidirectional-round-trip-fidelity]] — the property that proves a dialect is a faithful projection of the IR.
- [[declare-capability-dont-discover]] — how each target declares which slice of the IR it can carry.
- [[projection-is-not-the-source]] — the IR is the generator; each dialect is one lossy address over it.
