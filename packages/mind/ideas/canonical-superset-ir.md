---
kind: concept
delineation: One strongly-typed canonical form of which every target dialect is a projection — translate dialect-to-dialect through the superset, never pairwise.
---

# Canonical Superset IR

The compiler's IR play, applied to any translation domain (config, schema, document formats): N dialects need N read/write pairs to the center, not N² pairwise translators.

The center is the **superset** — it carries the union of what any dialect can express, so the richest dialect's form is usually the canonical shape. The same move at term grain is a canonical **vocabulary**: one shared name per concept, dialect-native names mapped onto it.

The round-trip floor is governed by [[lossless-floor]]. A projection of the IR is never the IR ([[projection-is-not-the-source]]).

## See also

- [[bidirectional-round-trip-fidelity]] — the property that proves a dialect is a faithful projection of the IR.
- [[declare-capability-dont-discover]] — how each target declares which slice of the IR it can carry.
- [[projection-is-not-the-source]] — the IR is the generator; each dialect is one lossy address over it.
