---
kind: principle
delineation: Place each piece of context at the narrowest scope where it is load-bearing — push it down to the depth that actually needs it, never hoist a narrow fact to a global parent; the placement altitude is the scope that uses it, and a parent carries only what every child needs.
---

# Context at the Load-Bearing Depth

Every piece of context has a **load-bearing depth**: the narrowest scope at which it is actually used to decide something. Place it there. A repo-wide invariant lives at the root; a package's architecture, gotchas, and decisions live in that package; a sub-system's conventions live in the sub-system. Push context **down** to the depth that needs it — and never hoist a fact that only one leaf uses up into a global parent, where it pollutes every reader's working set for no one's benefit.

This is the placement-altitude twin of [[decision-at-the-locus-of-need]]. That cell governs a decision that must come out **coordinated across many consumers** — resolve it once at the layer that sees every input. This cell governs the **opposite altitude failure that cell names as its companion**: context hoisted **above** the scope that actually needs it. The two share one root — fit the altitude to the locus — and circumscribe disjoint extensions: one joins inputs upward to coordinate, the other keeps narrow context downward to localize. A root document that restates what a child could derive or own is the over-hoist error; a leaf that re-declares a true repo-wide invariant is the under-push error.

Two operative rules:

- **The parent carries only the join.** A parent scope holds exactly what **every** child needs (the shared invariant, the cross-cutting rule); anything narrower belongs in the child. When the reader is already at the leaf, the relevant context is already loaded — so the parent stays small and the leaf is self-describing.
- **Don't duplicate down or up.** Context placed at its load-bearing depth has one home there; a deeper scope references the parent rather than restating it ([[cite-dont-copy]]), and the parent never inlines a child's particulars. The hierarchy is the index; placement is by the scope that uses the context, not by a stored altitude ([[projection-is-not-the-source]]).

The concrete instance is the hierarchical `CLAUDE.md` / `AGENTS.md` chain: root holds workspace-wide invariants and tooling; each package's doc holds package-load-bearing context; a sub-directory's doc appears only when it has its own load-bearing context. The directory tree is one projection of this placement; the principle is the generator.

## See also

- [[decision-at-the-locus-of-need]] — the coordinate-upward twin; this is the localize-downward companion failure that cell names.
- [[shard-by-orthogonal-concern]] — the orthogonal grain: which concern owns a unit, vs. at which depth context sits.
- [[cite-dont-copy]] — a deeper scope references the parent's invariant; it does not restate it.
- [[densest-faithful-point]] — a parent that inlines derivable child particulars carries surplus.
- [[agent-index-doc-style]] — the per-file floor that keeps each doc in the chain small.
- [[dream]] — what does _not_ belong in the chain: orthogonal facts route to agent memory, source-coupled facts route back here.
