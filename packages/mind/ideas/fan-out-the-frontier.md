---
kind: principle
delineation: Precompute parallelizable vertical slices up front, then dispatch the ready-frontier as a concurrent set — not a single next step — each slice carrying its fan-out width.
---

# Fan Out the Frontier

A plan is decomposed **up front** into **vertical** slices — each end-to-end on one concern, cut along the true boundary so two slices don't collide ([[shard-by-orthogonal-concern]]). The cut is the precompute: it is done once, at `start`, not discovered step by step.

The payoff is at the frontier. The ready-frontier is a **set**, not a single next task — every unblocked slice is dispatchable **now**, concurrently, to its own agent. To stop at one is to serialize work the cut already proved independent.

- **Vertical, not horizontal.** A slice owns one concern from end to end (its own author → execute → verify), so it carries no cross-slice handoff. Horizontal layers force a baton-pass; vertical slices fan out.
- **Each slice carries its fan-out width.** A slice that itself decomposes states how wide it spreads, so dispatch sees the whole frontier at once, not one task at a time.
- **The frontier is the dispatch unit.** Draw the set, fan it out, then re-draw as completions promote new slices to ready.

A single-next-step frontier is the smell that the slices were never cut to be independent — re-cut along the orthogonal concern.

## See also

- [[shard-by-orthogonal-concern]] — the cut that makes slices non-colliding, hence fannable.
- [[sharded-plan-layout]] — `ls tasks/ready/` is the concrete frontier-set this dispatches.
- [[self-sufficient-task]] — each slice is a self-sufficient spec, which is what lets it run detached.
- [[two-phase-bulk-then-unit-dispatch]] — precompute-the-set then dispatch is the same shape at the work-orchestration grain.
