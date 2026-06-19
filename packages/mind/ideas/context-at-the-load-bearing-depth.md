---
kind: principle
delineation: Place each piece of context at the narrowest scope where it is load-bearing — push it down to the depth that actually needs it, never hoist a narrow fact to a global parent; the placement altitude is the scope that uses it, and a parent carries only what every child needs.
---

# Context at the Load-Bearing Depth

The localize-downward twin of [[decision-at-the-locus-of-need]]: same root (fit the altitude to the locus), disjoint extension. That cell joins inputs **upward** to coordinate one decision across consumers; this one keeps narrow context **downward**. The named failures are dual: over-hoist (a root restating what a child could own) and under-push (a leaf re-declaring a repo-wide invariant).

Two operative rules:

- **The parent carries only the join** — exactly what _every_ child needs; anything narrower belongs in the child.
- **Don't duplicate down or up.** A deeper scope references the parent rather than restating it ([[cite-dont-copy]]); the parent never inlines a child's particulars. Placement is by the scope that uses the context, not a stored altitude ([[projection-is-not-the-source]]).

The concrete instance is the hierarchical `CLAUDE.md` / `AGENTS.md` chain: root holds workspace-wide invariants and tooling; each package's doc holds package-load-bearing context; a sub-directory's doc appears only when it has its own load-bearing context.

## See also

- [[decision-at-the-locus-of-need]] — the coordinate-upward twin; this is the localize-downward companion failure that cell names.
- [[shard-by-orthogonal-concern]] — the orthogonal grain: which concern owns a unit, vs. at which depth context sits.
- [[cite-dont-copy]] — a deeper scope references the parent's invariant; it does not restate it.
- [[densest-faithful-point]] — a parent that inlines derivable child particulars carries surplus.
- [[agent-index-doc-style]] — the per-file floor that keeps each doc in the chain small.
- [[dream]] — what does _not_ belong in the chain: orthogonal facts route to agent memory, source-coupled facts route back here.
