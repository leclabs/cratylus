# update-conventions

**Objective.** Reconcile the convention docs to the flat anatomy-sectioned layout.

**Preconditions.** Migration landed; the new layout is live.

**Operations.**

1. Update `packages/mind/ideas/AGENTS.md` (where-cells-live, the `kind` taxonomy incl. organs,
   the agent anatomy-section model, flat-skill + asset-by-front-matter convention).
2. Update the note in `docs/agent-conceptual-anatomy.md` (it currently blesses `mind/{kind}/{organ}/`)
   to state the anatomy is **section-structure inside an archetype**, not a directory taxonomy.

**Artifacts.** `packages/mind/ideas/AGENTS.md`, `docs/agent-conceptual-anatomy.md`.

**Acceptance (blind test).** A fresh contributor, reading only the updated `ideas/AGENTS.md`, can
place a new agent, skill, and organ correctly on the first try.
