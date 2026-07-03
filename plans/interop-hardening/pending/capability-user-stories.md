# capability-user-stories — the full story library over the capability floor

**Lane** Nico (author) + Operator (/elicit on genuine intent ambiguity) · **wave(1)** · deps:
⊳harness-landscape-research · ⊳standards-compat-research.

## Static

Both research returns (⊳). Library surfaces: `packages/agent-forge/{AGENTS.md, README.md}` · IR
schemas `packages/agent-forge/src/core/schema/` · pipeline skills
`~/.claude/skills/{exemplify,conceptualize,signify,materialize,elicit}/SKILL.md` · anatomy types
`packages/agent-forge/src/anatomy/`.

## Scope

Author the full user-story library (ρ=LLM; one story = actor · goal · precondition · observable
acceptance). **The capability floor every story set MUST cover:**

1. **Import** context from any supported harness's config files → the internal representation (IR).
2. **Output** the agent-factory IR format to a conventional `.{namespace}/` folder, across the
   commonly supported scopes (user · project · local — the `.claude/`-, `.agents/`-, `.cursor/`-
   class layouts).
3. **Reimport** from any supported harness's config files OR from our own format files.
4. **Re-export accurately** to any supported target harness (round-trip fidelity: import → IR →
   export preserves semantics; losses surface loudly per the lossy-translation contract).
5. **Plugin adapters**: for harnesses without native support for a resource but WITH a plugin
   architecture (e.g. Pi), an adapter delivers it. Resource floor: **agents + skills**;
   nice-to-have: **hooks**; recorded-as-future: tools, MCP.
6. **Context optimization**: import raw user context → the exemplify pipeline → clean reader=LLM
   output for any harness that supports it — skills as self-sufficient set-builder cells, agents as
   anatomy organ-vectors; where the input is ambiguous about organ values, **/elicit the Operator**.

Beyond the floor: stories the research reveals (standards output targets, cross-compat reads,
scope-precedence behaviors). Deliverable: `stories/` shards inside this plan (one file per epic,
stories numbered) + a coverage matrix stories × capabilities.

## Accept (falsifiers)

- Coverage matrix is CE over the floor: any floor capability with zero stories fails; any story
  with no observable acceptance fails.
- Every story is testable-as-written (a blind test author can derive a pass/fail check without
  asking); a story requiring interpretation fails.
- Ambiguities routed: intent-level unknowns carry an explicit `ELICIT:` marker for the Operator
  rather than an invented answer; an invented-answer story fails on discovery.
