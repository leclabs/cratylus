---
kind: principle
delineation: A package boundary is an ongoing cost (version contract, release coordination, integration surface, upgrade tax) — pay it only when forced by independent versioning, ownership, or deployment; absent a nameable forcing function it is premature, and de-packaging an unforced boundary is correct.
---

# Defer the Package Boundary

A package boundary buys isolation and reuse and charges a real, ongoing cost: a version contract, release coordination, an integration-test surface, an upgrade tax across consumers, an import-graph to police. **Pay it when the boundary is forced; not before.** The forcing functions are concrete — independent **versioning** (consumers need different versions at once), independent **ownership** (separate teams), or independent **deployment** (its own cadence/substrate). Absent at least one, the boundary is premature and the cost is pure (a two-consumer producer pays ~5× a same-package producer for the same code).

Monolith-first ([[fowler]]); an unforced boundary complects modularity-machinery with code that wanted to stay together ([[hickey]]). Unbraid concerns _inside_ a package ([[unbraided-code]]); compose at hubs ([[composition-hub]]) — don't preempt with a package split. A boundary paid for and never returned (one consumer covers 100% of use) is a sunk cost; **de-packaging it back into a directory is correct**, not regression.

This is not anti-modularity (modularity inside a package is always productive) and not "never extract" (when a forcing function exists, extract). The test: **name the forcing function before extracting; if you can't, don't.**

## See also

- [[fowler]] — monolith-first; YAGNI at the package grain.
- [[hickey]] — complecting cost; don't braid modularity-machinery into code that wants to stay together.
- [[unbraided-code]] · [[composition-hub]] — within-package modularity that substitutes for premature extraction.
- [[no-permissive-defaults]] — a silently-violated cross-boundary contract is the footgun at the package grain.
