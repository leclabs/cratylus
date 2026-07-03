# harness-landscape-research — the per-harness capability ground truth

**Lane** research fan-out (deep-research class), Nico judges · **wave(0)** · deps: none.

## Static

The library's current claim surface: `packages/agent-forge/AGENTS.md` (IR resource types · 10
adapters · lossy-translation contract · event taxonomy) · `packages/agent-forge/README.md` ·
`packages/agent-forge/src/adapters/` (the shipped dialect knowledge to verify against reality).

## Scope

For every popular harness (at minimum: Claude Code · Codex/OpenAI · Cursor · Copilot · Gemini CLI ·
Windsurf · Cline · aider · opencode · Crush · continue — extend where the field has moved): its
capabilities, features, configuration surfaces, file contracts (paths · formats · frontmatter ·
precedence/scopes), and consumer context shapes (rules/memory/skills/agents/hooks/MCP — what it
reads, from where, in what shape). Include each harness's plugin/extension architecture (whether a
missing native capability is adapter-reachable). Web research with citations; zero-trust the
library's own adapter code as a claim source (it is the thing under audit).

## Accept (falsifiers)

- A capability matrix (harness × {agents, skills, rules, hooks, tools, MCP, scopes, plugin-arch})
  where EVERY cell claim carries a source citation (doc URL / spec) — an uncited cell fails.
- Per-harness config-contract sheet (paths, formats, precedence) precise enough that a blind reader
  could write a fixture for it; a named harness whose sheet can't produce a fixture fails.
- Divergences from the library's current adapter assumptions explicitly listed (empty only if
  verified empty).
