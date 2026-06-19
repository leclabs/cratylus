---
kind: principle
delineation: Build the simplest thing that does the one job; add no speculative fallback, redundant option, or defensive alternative — when a design sprouts "primary + fallback," challenge whether the fallback is real or just hedging.
---

# Minimalism

One job, one responsibility — no more. When the "primary + fallback" sprouts, usually drop the fallback.

Unbuilt code can't break, drift, or mislead; every option you add is a surface you must carry.

## See also

- [[adopt-the-commons]] — for a solved domain the minimal custom layer is _zero_; adopt the standard.
- [[clean-slate]] — prune the speculative branch rather than carry it.
- [[defer-the-package-boundary]] — the package-grain application: an unforced boundary is a speculative surface.
