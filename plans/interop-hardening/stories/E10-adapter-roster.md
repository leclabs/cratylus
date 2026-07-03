# E10 · adapter-roster — the gap harnesses, the renames, the second tier

Research-driven (beyond floor): RETURN-1 §3 "Adapter roster vs field" — no adapters for Amp, Zed,
Windsurf/Devin, Kilo; Gemini→Antigravity and Windsurf→Devin renames; Roo sunset; aider a no-op in
practice until E8.S10's fix. Plus **Pi** (S8–S10), ground truth =
`../completed/pi-harness-research.RETURN.md` (`[PI#]` refs). New-adapter stories share the
**new-adapter contract**: fixture from the harness's §2 sheet; import (E1.S2 discipline) +
compile (E2.S3/S4) + round-trip (E4.S1) + honest capabilities (E4.S3); listed by
`agent-forge adapters`. ρ=LLM.

---

## E10.S1 · Amp adapter

A: FLEET · P: §2/Amp sheet.
✓ (beyond contract):

- Rules: AGENTS.md cwd→$HOME chain + `~/.config/amp/AGENTS.md`; @-imports recognized on read
  [AM1]. Skills: emit to `.agents/skills/` (Amp reads it natively) — no bespoke dir [AM4].
- Settings: flat `amp.*` keys in `.amp/settings.json` (workspace) / `~/.config/amp/settings.json`
  (user); MCP under `amp.mcpServers` [AM1].
- Agents + commands + hooks via the plugin emitter (E5.S2/E5.S4-class artifacts; legacy
  `amp.hooks`/toolboxes never emitted — retired [AM2][AM3]).

## E10.S2 · Zed adapter

A: FLEET · P: §2/Zed sheet.
✓:

- Skills: exactly `<worktree>/.agents/skills/` + `~/.agents/skills/` (Zed's only paths) [ZD2];
  frontmatter constraints enforced (name ≤64 `[a-z0-9-]`, description <1024B).
- Rules: project single-file first-match chain — adapter writes `AGENTS.md` and warns if a
  higher-precedence file (`.rules`, `.cursorrules`, …) exists and would shadow it [ZD1].
- MCP: `context_servers` in `.zed/settings.json`/user settings [ZD3]. Hooks/commands: declared
  `none` (truth [ZD5][ZD8]); agents: `none` + note (subagent tool/ACP are not file-config [ZD4]
  [ZD6]).

## E10.S3 · Windsurf/Devin adapter

A: FLEET · P: §2/Windsurf-Devin sheet.
✓:

- Rules: `.devin/rules/*.md` preferred, `.windsurf/rules/` legacy-read [WS7][WS1]; `trigger:`
  4-mode frontmatter via E9.S2 mapping; 12k char/file cap enforced (over-cap = split or warn,
  documented which); global `global_rules.md` 6k cap [WS1].
- Workflows as commands (`.windsurf/workflows/*.md`) [WS4]; skills `.windsurf/skills/` +
  `.agents/skills/` reach [WS3]; hooks `hooks.json` snake_case 12-event dialect [WS2]; MCP
  `~/.codeium/windsurf/mcp_config.json` [WS5].

## E10.S4 · Kilo adapter

A: FLEET · P: §2/Kilo sheet.
✓:

- Config `kilo.jsonc` / `.kilo/kilo.jsonc` / `~/.config/kilo/kilo.jsonc` precedence honored
  [KL1]; agents `.kilo/agents/*.md` with `mode:`+ordered `permission` rules [KL1]; rules
  `.kilo/rules/` [KL2]; commands `.kilo/commands/*.md` (`subtask:`) [KL7]; skills `.kilo/skills/`
  (+ reads `.agents/skills/`) [KL3]; MCP typed `local|remote`, command-ARRAY (E9.S1) [KL5];
  hooks via plugin emitter [KL6].
- Legacy `.kilocode/*` read-only recognized on import, never written [KL1].

## E10.S5 · renames, sunsets, no-ops are roster facts, not folklore

A: OPERATOR · G: the adapter roster tracks the field's consolidation events with explicit
statuses.
✓:

- Adapter ids follow the field (Operator ruling): **canonical ids `antigravity` and `devin`**;
  `gemini` and `windsurf` are retained as ALIASES resolving to those canonical adapters —
  `agent-forge adapters` lists the canonical id with its alias, and invoking either id yields the
  identical adapter (same output tree, id-resolution assertion) [GM7][WS7].
- Per-adapter status metadata: roo (if ever requested) → `sunset` pointing at cline [RO5]; aider
  stays on the roster, functional via the E8.S10 read-wiring fix.
- Importing a config for a sunset/renamed id succeeds with a status notice; compiling to one
  emits the successor's dialect or a documented refusal — never a stale dialect silently.

## E10.S6 · second tier reached through standards, not bespoke adapters

A: FLEET · G: Factory Droid, Goose, Warp, Trae, Augment, Junie, Qwen, Antigravity consume the
E7 standards outputs with zero adapter code.
P: E7.S1/S3/S4/S5 outputs; per-harness documented read paths [FS1]–[FS9].
✓:

- A pinned reach matrix test: for each second-tier harness, the standards output set contains a
  file at a path that harness documents reading (AGENTS.md: Factory/Goose/Warp/Trae/Augment/
  Junie/Antigravity [FS2][FS3][FS4][FS5][FS6][FS8][FS9]; `.agents/skills/`: Antigravity/Goose
  [FS9][S54]); config-gated harnesses (Qwen `contextFileName` [FS1]) are listed `cfg` with the
  required knob named.
- No bespoke adapter exists for these ids (parsimony guard — building one requires retiring this
  story consciously).

## E10.S7 · roster release-audit ritual

A: OPERATOR · G: the 2026 consolidation rate (4 renames/sunsets in 6 months — RETURN-1 §0) is met
with a standing re-verification checklist, not ad-hoc discovery.
✓:

- A dated checklist doc exists in the plan (or docs/) listing per-adapter: source-doc URLs
  (RETURN ledgers), last-verified date, the UNVERIFIED items still open (codex agent-TOML syntax
  [CX1], opencode singular-dir alias [OC2], Devin Local subagent config [WS7], Continue AGENTS.md
  [CT2], pi trust.json schema + theme key set + subagent frontmatter superset — pi RETURN §4),
  and the E7.S10 tripwire. Pi carries the pi RETURN's volatility note (pre-1.0, 0.80.x —
  re-verify [PI2] before cutting fixtures into tests). Observable: file present, every current
  adapter has a row, every §2-flagged UNVERIFIED appears exactly once.

## E10.S8 · Pi adapter — natural emissions (config surfaces)

A: FLEET · P: pi RETURN §2 sheet; new-adapter contract.
✓ (beyond contract):

- Rules: root `AGENTS.md` — the R1/E7.S1 artifact lands UNCHANGED (pi natively concatenates
  `~/.pi/agent/AGENTS.md` → ancestors → cwd; `CLAUDE.md` is a co-equal alternative read on
  import) [PI2]; no `.pi/AGENTS.md` is ever written — that surface does not exist [PI2]. System-
  prompt surfaces (`SYSTEM.md`/`APPEND_SYSTEM.md`, both scopes) recognized on import [PI2].
- Skills: the R2/E7.S3 `.agents/skills/` tree lands UNCHANGED (pi discovers it natively,
  cwd→ancestors + `~/.agents/skills/`) [PI5]; no `.pi/skills/` emission needed (a second native
  home, redundant — parsimony); frontmatter constraints enforced (`name` ≤64 `[a-z0-9-]`,
  `description` required ≤1024 — undescribed skills are not loaded) [PI5].
- Commands: IR commands → prompt templates `.pi/prompts/*.md` (project) /
  `~/.pi/agent/prompts/*.md` (user); frontmatter `description`/`argument-hint`; substitution
  mapped `$1..$n`, `$ARGUMENTS`/`$@`, `${1:-default}` [PI7].
- Scopes: global `~/.pi/agent/` vs project `.pi/`; import honors project-over-global deep-merge
  of `settings.json` and lifts the resource keys (`packages`, `extensions`, `skills`, `prompts`)
  [PI4][PI2].
- Trust gating loud (acceptance condition): every project-scope write (`.pi/*`,
  `.agents/skills/`) appends the inert-until-trusted warning naming `~/.pi/agent/trust.json` +
  `/trust` [PI2 §Project Trust]; a project-scope pi write without the warning = FAIL.
- Capabilities honest: hooks/subagents/permissions/MCP declared absent as CONFIG surfaces
  (delivery is `plugin` mode — E10.S9); MCP `none` by design [PI2].

## E10.S9 · Pi code emission — hooks + agents as a generated pi package (the demonstration case)

A: FLEET + DEV · P: E5.S8's fixtures; pi RETURN §3 capability map.
✓:

- All code-shaped resources ship as ONE generated pi package: `package.json` with
  `"keywords": ["pi-package"]` and `"pi": {"extensions": [...]}` manifest [PI6]; report includes
  the install line (`pi install ./<path>`, local = path-referenced) and the [PI6] caution that
  packages run with full system access — review before install.
- Hooks: extension maps canonical events per E5.S8's table onto `pi.on()`; blocking hooks use the
  `tool_call` veto `{block: true, reason}`; result-mutating hooks use `tool_result` [PI3].
- Agents: subagent-pattern emission per E5.S8 (md defs + `registerTool` delegate [PI9]); the
  `registerTool` path emitted here is by design the same serializer a future Tool resource type
  will use — pi is the demonstration instance that seeds E5.S6's graduation, which stays FUTURE
  until the IR carries a Tool type (E9.S5).
- Emitted TS type-checks in CI; `/reload` suffices to activate without restart (documented in
  report) [PI3][PI2].
- Round-trip honesty: code emissions are declared write-only (`plugin` mode, no read-back);
  reimport of a pi fixture lifts config surfaces (E10.S8) and reports extension files under
  `unlifted-surfaces` (E1.S7 discipline) — never parses foreign TS as config.

## E10.S10 · Pi MCP — FUTURE (absent by design, mechanism named, no verified artifact)

A: OPERATOR · G: pi's loudest omission is on the record with its designated path, not guessed at.
✓:

- Status `FUTURE` — excluded-by-marker from the coverage-test wave, here and in COVERAGE.md.
- Scope recorded: pi omits MCP deliberately ("No MCP. Build CLI tools with READMEs (see Skills),
  or build an extension that adds MCP support" [PI2][PI14]); the mechanism would be an extension
  wrapping an MCP client and surfacing tools via `registerTool` [PI3]; no first-party artifact
  exists and any third-party pi-package for MCP is UNVERIFIED (pi RETURN §3). No implementation
  story may claim pi-MCP until a verified artifact or a deliberate build graduates this record.
