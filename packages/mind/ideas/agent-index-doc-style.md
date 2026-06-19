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
