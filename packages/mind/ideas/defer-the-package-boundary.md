---
kind: principle
delineation: A package boundary is an ongoing cost (version contract, release coordination, integration surface, upgrade tax) — pay it only when forced by independent versioning, ownership, or deployment; absent a nameable forcing function it is premature, and de-packaging an unforced boundary is correct.
---

# Defer the Package Boundary

The forcing functions are exactly three: independent **versioning** (consumers need different versions at once), independent **ownership** (separate teams), independent **deployment** (its own cadence/substrate). Absent at least one, a two-consumer producer pays ~5× a same-package producer for the same code.

Monolith-first ([[fowler]]); an unforced boundary complects modularity-machinery with code that wanted to stay together ([[hickey]]). Unbraid concerns _inside_ a package ([[unbraided-code]]); compose at hubs ([[composition-hub]]) — don't preempt with a split. De-packaging an unreturned boundary (one consumer covers 100% of use) into a directory is correct, not regression.

The test: **name the forcing function before extracting; if you can't, don't.**

## See also

- [[fowler]] — monolith-first; YAGNI at the package grain.
- [[hickey]] — complecting cost; don't braid modularity-machinery into code that wants to stay together.
- [[unbraided-code]] · [[composition-hub]] — within-package modularity that substitutes for premature extraction.
- [[no-permissive-defaults]] — a silently-violated cross-boundary contract is the footgun at the package grain.
