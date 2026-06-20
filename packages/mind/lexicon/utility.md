<!-- ^agent-index-doc-style -->
---
kind: utility
delineation: The per-file style floor for an agent-targeted index doc (AGENTS.md / CLAUDE.md) — agent-compression, keep the required preamble verbatim, cut anything derivable from ls/git/package.json/file content, target <40 lines.
---

# Agent Index-Doc Style

The style floor for an agent-targeted index doc (`AGENTS.md`, `CLAUDE.md`): agent-compression in the agent register ([[context-not-prose]]).

- Keep required preambles verbatim (e.g. the standard `/init` header).
- Lead each section with the fact; drop transitional prose; compact bullets and inline parentheticals over paragraphs ([[densest-faithful-point]]).
- Cut anything an agent can derive from `ls`, `git log`, `package.json`, or file content.
- Keep only the non-obvious: heterogeneous structure, tooling-enforced conventions, hook behaviour, version pins, precedence rules, gotchas.
- Route reads to the canonical home; don't restate it ([[cite-dont-copy]]).
- Target **< 40 lines** per file unless the subject genuinely warrants more.

## See also

- [[context-not-prose]] — the underlying register; this is its index-doc floor.
- [[context-at-the-load-bearing-depth]] — the placement rule this style floor serves.
- [[cite-dont-copy]] — route to canonical docs rather than restating them.
- [[architecture-md-diagrams-only]] — the sibling style-floor, for ARCHITECTURE.md (diagrams, not prose).
<!-- ^ontoclean-meta-properties -->
---
kind: utility
delineation: The OntoClean rubric — tag each property with four meta-properties (Rigidity, Identity, Unity, Dependence) and reject subsumptions that violate their constraints; the reusable test pyramid-decomposition applies to clean a taxonomy.
---

# OntoClean Meta-Properties

[[pyramid-decomposition]] applies the rubric (Guarino & Welty, [[nicola-guarino]]). Tag each property:

- **Rigidity (R)** — essential to every instance (+R), or never essential (anti-rigid, ~R). _Person_ is +R; _student_ is ~R.
- **Identity (I)** — carries an identity criterion (+I); _supplies its own_ (+O).
- **Unity (U)** — its instances are wholes under one unifying relation (+U).
- **Dependence (D)** — every instance requires some external entity (+D).

**Subsumption constraints** — a violation is a taxonomic error to fix:

- An anti-rigid property cannot subsume a rigid one.
- Properties with incompatible identity or unity criteria cannot stand in is-a.
- Identity and unity must carry consistently down a subsumption chain.

## See also

- [[identity-criteria-before-taxonomy]] — the disposition this rubric serves.
- [[formal-ontology]] — the framework it operationalizes.
