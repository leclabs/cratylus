---
kind: principle
delineation: ARCHITECTURE.md carries diagrams of stable structure (boundaries, data flow, control flow, invariants) and nothing else — explanation rots, diagrams of stable structure don't; prose belongs in README or the code-adjacent doc.
---

# ARCHITECTURE.md — Diagrams Only

`ARCHITECTURE.md` is diagrams of stable structure and **nothing else**: deployment topology, container internals, state machines. Zero prose.

Rules:

1. Stable boundaries / data flow / control flow / invariants only.
2. Diagram-first (Mermaid is the lingua franca); one concept per diagram, labeled edges.
3. Implementation detail belongs in the relevant `README.md`, not architecture.
4. Plans go in `plans/` ([[sharded-plan-layout]]); drafts in a sibling clearly flagged "draft, not contract."

Anti-pattern: paragraphs of explanation. If a paragraph seems needed, the diagram is incomplete or the paragraph belongs in `README.md`.

## See also

- [[arch-doc-writer]] — the archetype that maintains this discipline.
- [[cite-dont-copy]] — the doc is the index; code-adjacent detail is canonical.
- [[doc-mirrors-runtime-truth]] — the diagram mirrors structure; drift is detected, not narrated.
- [[agent-index-doc-style]] — the sibling style-floor, for agent index docs (AGENTS.md / CLAUDE.md).
