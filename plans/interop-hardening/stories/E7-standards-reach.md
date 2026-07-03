# E7 · standards-reach — the three hardened standards as first-class output/input targets

Research-driven (beyond floor): implements `standards-compat-research.RETURN.md` §3's ranked
shortlist R1–R6 + §1 cautions. Refs `[Sn]` resolve in that RETURN's ledger. ρ=LLM.

---

## E7.S1 · AGENTS.md is the canonical rules projection (R1)

A: FLEET · G: one rules compile reaches every AGENTS.md-native harness with zero per-vendor work.
P: project IR with 3 ordered rules; targets incl. codex, copilot, cursor, opencode, crush, cline.
✓:

- Compile emits root `AGENTS.md` = rules concatenated by `order` (rule.schema `order`/`concat`
  honored); one file serves all AGENTS.md-native targets (no per-target duplicate bodies —
  targets share the artifact or emit byte-identical copies, declared which).
- Refs: native-reader set per matrix [S1] + RETURN-1 §0 convergence list.

## E7.S2 · nested AGENTS.md are self-sufficient (caution iii)

A: AUTHOR · G: monorepo-scoped rules emit per-dir AGENTS.md that stand alone under BOTH merge
semantics (closest-wins replacement per FAQ [S1] vs Codex root→cwd concatenation [S9]).
P: IR rules scoped to `packages/a/` and root.
✓:

- Emitted `packages/a/AGENTS.md` contains the complete guidance for its subtree — validated by a
  self-sufficiency check: no anaphoric references out of file (pinned denylist: "in addition to
  the root", "as above", `@`-imports pointing upward), and a blind-read test key confirming the
  subtree rules are all present in the one file.
- Same IR compiled for a replacement-semantics target and a concat-semantics target yields
  correct effective rules under both models (documented truth table asserted).

## E7.S3 · `.agents/` as an EXPORT surface — Agent Skills to `.agents/skills/`, spec-strict core (R2)

A: FLEET · G: one authored skill tree reaches Codex/Cursor/Copilot/Gemini/Zed/Amp/Goose/Crush/
opencode natively. `.agents/` is an export target only (Operator ruling): the IR home stays
`.agent-forge/` (E2), and this story is the one explicit `.agents/`-tree emission story.
P: IR skill with core + extension fields.
✓:

- `.agents/` output is compile-produced export, never IR: no IR-format file (manifest, resource
  folders) is ever written under `.agents/` (path guard assertion).
- Compile emits `.agents/skills/<name>/SKILL.md` with ONLY spec fields in shared-core mode
  (`name`,`description`,`license`,`compatibility`,`metadata`,`allowed-tools` [S3]); `name` =
  parent dir name; `skills-ref validate` passes [S6] (the pinned conformance oracle — the spec is
  unversioned, caution ii).
- Harness-specific extras (Claude `context: fork`/`hooks`, Cursor `paths`, Codex
  `agents/openai.yaml`) are emitted only into that harness's own path, never into the neutral
  tree; presence in `.agents/skills/` = FAIL.

## E7.S4 · `.claude/skills/` mirror of the neutral tree (R3)

A: FLEET · G: close the Claude-Code gap (ignores `.agents/`) at near-zero marginal cost.
P: E7.S3 output; mirror mode on.
✓:

- `.claude/skills/` resolves to the identical skill set: symlink on POSIX (target verified),
  copy-fallback on platforms without symlink (byte-equal trees); direction documented
  (author-once in `.agents/skills/`).
- Drift guard: a mirror that diverges from its source fails `agent-forge doctor`.

## E7.S5 · CLAUDE.md as a pure projection of AGENTS.md (R4)

A: OWNER · G: the instruction layer is authored once; Claude reads it via its own documented shim.
P: E7.S1 output; target claude.
✓:

- Emitted `CLAUDE.md` body is exactly the `@AGENTS.md` import (+ at most a fixed managed-region
  header) — no duplicated rule text (grep: rule body strings absent from CLAUDE.md) [S7].
- E3.S5 foreign-content preservation holds for a pre-existing hand CLAUDE.md.

## E7.S6 · one MCP model, per-dialect serializers (R5)

A: FLEET · G: a single IR server definition lands correctly in every config dialect.
P: IR: one stdio server + one HTTP server; targets claude, cursor, copilot(vscode), gemini,
codex.
✓:

- Emitted shapes exactly per dialect: `.mcp.json` `mcpServers` [S44]; `.cursor/mcp.json` [S45];
  `.vscode/mcp.json` root key `servers` [S46]; `.gemini/settings.json` with `httpUrl` for HTTP vs
  `url` for SSE [S11]; `~/.codex/config.toml` `[mcp_servers.<n>]` TOML, no `type` key, no SSE
  [S47].
- A dialect that cannot express the server's transport warns per E4.S2.

## E7.S7 · vendor rules dirs only where activation semantics demand (R6)

A: AUTHOR · G: glob-scoped/always-on/manual rules compile to vendor dirs; plain rules never do.
P: IR rule A (plain) + rule B (globs: `src/**`, alwaysApply: false).
✓:

- Rule A appears only in AGENTS.md-class outputs; zero vendor rules-dir files exist for it.
- Rule B emits `.cursor/rules/<id>.mdc` (frontmatter description/globs/alwaysApply [S19]),
  `.github/instructions/<id>.instructions.md` (`applyTo` [S57]), `.clinerules/<id>.md` (`paths:`
  [S22]) — per target; activation semantics preserved per-dialect (field mapping table pinned).

## E7.S8 · never build on unmerged proposals (caution i)

A: DEV · G: no output depends on `.agents/rules/` or AGENTS.md frontmatter (open proposals
[S59][S2]).
P: full compile of a maximal IR across all targets.
✓:

- Output tree contains no `.agents/rules/` path; no emitted `AGENTS.md` begins with YAML
  frontmatter (`^---` guard). This is a standing guard test, red the day someone reaches for the
  unmerged proposal.

## E7.S9 · standards-native import source

A: OWNER · G: a repo carrying only the neutral standards (no vendor dirs) lifts into IR.
P: fixture: root+nested `AGENTS.md`, `.agents/skills/x/SKILL.md`, no `.claude/`/`.cursor/` etc.
✓:

- `agent-forge import agnostic` (id per implementation, but a dedicated standards importer — not
  a side effect of a vendor adapter) yields rule resources (root + nested, scoping recorded) and
  the skill; lint passes; the importer is listed by `agent-forge adapters`.

## E7.S10 · Claude-Code-adopts-AGENTS.md tripwire (caution iv)

A: DEV · G: when Claude Code ships native AGENTS.md (its most-upvoted open request [S49]), R4's
shim work collapses — detect it, don't rediscover it.
P: pinned assumption record.
✓:

- The claude adapter's "CLAUDE.md-not-AGENTS.md" premise is encoded as an explicit tested
  assumption (a fixture/doc pair naming [S7][S62] and issue [S49]); the release-audit checklist
  (E10.S7) lists it as a watch item. Observable: the assumption record exists and CI carries the
  premise as an assertable fact, so a flip is a one-line change with a known blast radius.
