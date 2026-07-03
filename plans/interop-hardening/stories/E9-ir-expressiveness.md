# E9 · ir-expressiveness — the IR grows to carry what the field actually has

Research-driven (beyond floor): implements RETURN-1 §3 "Cross-cutting (engine/IR level)".
Schema changes here are the enablers E7/E8 stories compile against. ρ=LLM.

---

## E9.S1 · McpServer model covers the field's dialects

A: DEV · G: one IR entry can express every documented server shape without lossy flattening.
P: schema `mcp-server.schema.json` + fixtures per dialect.
✓:

- Representable and round-tripping: command-as-array (opencode/Kilo [OC7][KL5]); SSE-vs-HTTP
  transport distinction (Gemini `url`/`httpUrl` [GM1]); `bearer_token_env_var`+`http_headers`
  (Codex [CX7]); `disabled`/`autoApprove` (Cline [CL6]); `includeTools`/`excludeTools`/`trust`/
  timeouts (Gemini/Codex [GM1][CX7]); headers/auth (Cursor [CU5]).
- Each adapter serializes only its dialect's fields; an IR field the dialect lacks warns per
  E4.S2. Schema regenerates types (`pnpm gen`) and all existing fixtures still validate.

## E9.S2 · Rule gains activation + placement metadata

A: AUTHOR · G: rules can say WHERE and WHEN they apply, so vendor dialects stop being lossy.
P: `rule.schema.json` extension; fixtures per dialect.
✓:

- New optional fields cover: `description`, `globs`/`applyTo`/`paths` (one canonical field,
  adapter-mapped), `activation` (`always|auto|glob|manual` — the convergent vocabulary [S19]
  [WS1][CL1][CP3][CT2]), `dir` (subtree placement for nested AGENTS.md).
- Compile mapping table pinned: canonical → `.mdc` frontmatter [CU1], `.windsurf/rules` `trigger:`
  [WS1], `.clinerules` `paths:` [CL1], `.instructions.md` `applyTo` [CP3], `.continue/rules`
  frontmatter [CT2], `.claude/rules` `paths:` [CC1]; a dialect lacking a mode warns, never
  silently reinterprets.
- Plain rules (no metadata) behave exactly as today (backward-compat fixture).

## E9.S3 · hook capability metadata tells the truth per dialect

A: DEV · G: `payload`/`matchers`/event-dialect declarations match documented reality.
P: ground-truth table from RETURN-1 §2 (per adapter: envelope, event case, matcher semantics,
hook types, block mechanism).
✓:

- Assertion test: declaration table ≡ ground-truth table for all adapters; `payload:
'claude-json'` claimed only by claude(+codex hooks.json); `matchers` = `regex` for
  gemini/cursor/crush/copilot/claude, `none` for cline [CC6][GM4][CU2][CR3][CP4][CL2].
- `agent-forge events --client <c>` output derives from the same single table (DRY — one home).

## E9.S4 · writes are read-merge, never whole-file clobber

A: OWNER · G: every shared-file surface (settings.json, CLAUDE.md/AGENTS.md, opencode.json,
crush.json, config.yaml, .aider.conf.yml) preserves foreign content.
P: per shared-file surface: fixture pre-populated with foreign keys/sections + forge content.
✓:

- Post-compile, foreign content is byte-identical; forge content sits inside documented managed
  regions (JSON: forge-owned keys only; markdown: marker-delimited block); repeat compile is
  idempotent (E2.S2 discipline).
- A deliberate conflict (foreign edit inside a managed region) is reported as drift (E3.S4), not
  silently reclaimed.

## E9.S5 · field-demanded resource types recorded (FUTURE ledger)

A: OPERATOR · G: the resource types the field now has but the IR lacks are on the record with
owners-to-be, excluded from the current test wave.
✓ (record, assertable by presence in COVERAGE.md FUTURE section):

- `Lsp` (Crush `lsp` key [CR1]); typed permission DSLs (opencode `permission` [OC8], Kilo ordered
  glob rules [KL1], Amp plugin-mediated [AM2], Zed `tool_permissions` [ZD5], Cursor CLI
  `.cursor/cli.json` [CU9]); plugins-as-deliverable (beyond E5's emitters); context-file-name
  parameter (`GEMINI.md`/`QWEN.md`/`CRUSH.md` as a target knob [GM1][FS1][CR2]); skill
  supporting-file trees beyond flat `files[]` (scripts/references/assets semantics [S3]).

## E9.S6 · agent + skill schemas carry the documented frontmatter surface

A: DEV · G: the IR agent/skill types stop under-modeling the richest documented dialects.
P: `agent.schema.json`/`skill.schema.json` + claude/cursor/copilot fixtures.
✓:

- Agent: optional `permission_mode`, `max_turns`, `temperature`, `mode` (primary|subagent|all
  [KL1][OC2]), `memory`, `effort` representable (adapter-mapped or warned) [CC2][CU3][CP1][GM2].
- Skill: optional `license`, `compatibility`, `metadata`, `paths` (activation globs),
  `user_invocable`, `disable_model_invocation` [S3][CC3][CU4][CR1].
- Round-trip per E4.S1 for each new field on its richest-dialect adapter; spec-strict core
  emission (E7.S3) is unaffected (new fields stay out of the neutral tree unless spec fields).
