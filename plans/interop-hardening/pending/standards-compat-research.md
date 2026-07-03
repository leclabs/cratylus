# standards-compat-research — industry specs + cross-harness compatibility

**Lane** research fan-out (deep-research class), Nico judges · **wave(0)** · deps: none.

## Static

`packages/agent-forge/AGENTS.md` (the IR's standard-alignment claims) · the corpus's standards
posture (`packages/agent-anatomy/ideas/AGENTS.md`, THE INVARIANT: industry-standard alignment).

## Scope

(1) The industry-backed standard specs, each summarized to its normative content with source links:
**Agent Skills** (the skills spec + SKILL.md shape) · **AGENTS.md** (agents.md spec, nesting/
precedence, adoption list) · **`.agents/` directory conventions** — plus any emergent sibling specs
the research surfaces (e.g. MCP as it touches config, `.cursor/rules`-class conventions that
harden into standards). (2) The **cross-compatibility matrix**: which harnesses read which other
harnesses' formats natively (many read Claude's; some read AGENTS.md; some symlink); what each
supports of the standards; where compat is first-party vs community shim. Web research, cited.

## Accept (falsifiers)

- Each spec: normative summary + version/date + canonical URL; a spec summarized without its source
  fails.
- Compat matrix (harness × {reads-claude, reads-agents-md, reads-agent-skills, reads-.agents/,
  other-cross-reads}) fully cited; an uncited cell fails.
- A ranked shortlist: which conventional `.{namespace}/` output targets and standard formats give
  the library maximum reach per unit of adapter work (the story task consumes this).
