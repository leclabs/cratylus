# E8 · divergence-fixes — retire every fabricated shape §3 found

Research-driven (beyond floor): one story per adapter, folding that adapter's
`harness-landscape-research.RETURN.md` §3 findings. Common acceptance discipline for every story
here (the **fix contract**): (a) compile emits ONLY documented paths/shapes — each fabricated
path/key named below is absent from output (exact-path/key greps); (b) a fixture built from the
RETURN §2 sheet round-trips per E4.S1; (c) import of the fabricated shape follows E1.S3
(loud-unknown). Refs `[XX#]` resolve in RETURN-1 §5. ρ=LLM.

---

## E8.S1 · claude — MCP homes + hook model + rules surfaces

A: DEV · P: §2/Claude-Code fixtures. Findings: §3/claude d1, d3, d4, d5.
✓ (beyond fix contract):

- User/local-scope MCP servers emit to `~/.claude.json` (local keyed per-project path), project to
  `.mcp.json`; `mcpServers` never appears in any settings.json; settings.json carries only policy
  keys [CC7][CC8].
- Hook model: types `command|http|prompt|agent|mcp_tool`, fields `if`/`args`/`shell`/`env`
  round-trip; capability declares matchers `regex` (not glob) [CC6].
- Rules: `.claude/rules/*.md` with `paths:` frontmatter read+written; local scope rules →
  `CLAUDE.local.md`; `.claude/CLAUDE.md` alt location read; CLAUDE.md writes are non-destructive
  (E3.S5 markers) [CC1].

## E8.S2 · codex — skills home, agent TOML, hooks gate, config keys, MCP shape

A: DEV · P: §2/Codex fixtures. Findings: §3/codex d1–d6.
✓:

- Skills emit to `.agents/skills/` (project: cwd/repo-root) + `~/.agents/skills/` (user); nothing
  to `.codex/skills/` [CX2].
- Agent TOML uses documented fields (`name`,`description`,`developer_instructions`,`model`,
  `sandbox_mode`,`mcp_servers`); `system_prompt`/`tools`/`color` gone [CX1].
- No `[features] codex_hooks` key; hooks land in `hooks.json`/`[hooks]` with the 7-event set
  [CX4]. No `permissions`/`env` TOML keys; approval/sandbox/shell_environment_policy mapped or
  warned [CX6].
- Remote MCP: `url` + `bearer_token_env_var`/`http_headers`; no `type`, no SSE [CX7].
- Read side lifts: AGENTS.override.md + walk-down chain + fallback filenames (E1.S7) [CX3].

## E8.S3 · gemini — context filename, commands, MCP transports, config keys

A: DEV · P: §2/Gemini fixtures. Findings: §3/gemini d1–d5, d7.
✓:

- Rules emit to `GEMINI.md` (or emit `context.fileName` config naming AGENTS.md — one strategy,
  documented + tested); a stock install reads the result [GM1].
- Commands capability on: `.gemini/commands/*.toml` written/read (`prompt` required) [GM5].
- MCP: SSE → `url`, streamable HTTP → `httpUrl`; `trust`/`includeTools`/`excludeTools`/`timeout`
  representable [GM1]. No fabricated `permissions`/`env` settings keys [GM1].
- Hooks: add `BeforeToolSelection`; matcher declared regex; timeout in ms [GM4].
- Scope model includes system + system-defaults tiers (system OUTRANKS project) at least in
  read/report [GM1].

## E8.S4 · copilot — hooks dialect, user home, skills dir, agents, prompts

A: DEV · P: §2/Copilot fixtures. Findings: §3/copilot d1–d8.
✓:

- Hooks: written to `.github/hooks/*.json` / `~/.copilot/hooks/*.json` in the documented envelope
  (`{"version":1,...}`, camelCase events, `bash`/`powershell`, `timeoutSec`); the ".claude/
  settings.json is parsed by Copilot" premise is deleted [CP4].
- User scope = `~/.copilot/` (agents/, skills/, hooks/, mcp-config.json); nothing under
  `~/.config/github-copilot/` [CP8].
- Skills → `.github/skills/` (repo) [CP2]; agents → `.github/agents/*.agent.md` with documented
  frontmatter [CP1]; prompts → `.github/prompts/*.prompt.md` (commands capability on) [CP5].
- Event map re-keyed to the camelCase dialect incl. permissionRequest/errorOccurred [CP4].

## E8.S5 · cursor — hooks envelope, rules .mdc, agents, commands

A: DEV · P: §2/Cursor fixtures. Findings: §3/cursor d1–d7.
✓:

- Hook JSON carries required `"version": 1`; `failClosed`/`loop_limit`/prompt-type representable
  or warned [CU2].
- `.cursor/rules/*.mdc` read AND written (description/globs/alwaysApply, 4 activation types via
  E9.S2 metadata); `.md` files in that dir are not emitted (ignored by Cursor) [CU1].
- Agents: `.cursor/agents/*.md` emitted with documented frontmatter [CU3]; commands capability on
  (`.cursor/commands/*.md`) [CU6].
- Remote MCP drops the undocumented `type` key [CU5]. `~/.cursor/AGENTS.md` no longer written
  (UNVERIFIED-as-consumed) [CU1].

## E8.S6 · opencode — MCP in opencode.json, agents+commands on, permission key

A: DEV · P: §2/opencode fixtures. Findings: §3/opencode d1–d5.
✓:

- MCP lives under `"mcp"` in `opencode.json` with typed `local|remote` entries and `command` as
  an ARRAY; `.opencode/mcp.json` never emitted [OC7].
- Agents (`.opencode/agents/*.md`, `mode:` field) and commands (`.opencode/commands/*.md`)
  capabilities on [OC2][OC4].
- No `permissions.json`/`env.json`; IR permissions map to the `"permission"` DSL where
  expressible, warned where not [OC8][OC1].
- Hook-plugin shim emits only [OC5]-verified event names (E5.S4).

## E8.S7 · cline — hooks-as-scripts, Documents rules home, skills+workflows on, MCP paths

A: DEV · P: §2/Cline fixtures. Findings: §3/cline d1–d7.
✓:

- Hooks emit as per-event executable script files (no extension) in `.clinerules/hooks/` honoring
  the stdin/stdout JSON contract; `.cline/hooks.json` never emitted; event set = the documented 6
  [CL2][CL3].
- Global rules → `~/Documents/Cline/Rules` (OS-variant table) [CL1]; skills (`.cline/skills/`)
  and workflows (`.clinerules/workflows/*.md`) capabilities on [CL4][CL5].
- MCP: CLI target `~/.cline/mcp.json`; extension target documented-as-unreachable-file (warn) or
  globalStorage path behind an explicit override; `disabled`/`autoApprove`/`streamableHttp`
  representable [CL6].

## E8.S8 · crush — MCP + hooks inside crush.json, global context paths

A: DEV · P: §2/Crush fixtures. Findings: §3/crush d1–d6.
✓:

- MCP under the `"mcp"` key of `crush.json`/`.crush.json`/`~/.config/crush/crush.json` with
  required-style `type`; `.crush/mcp.json` never emitted [CR1].
- Hooks capability on: `hooks.PreToolUse` (regex matcher, exit-2 block) [CR3]; permissions
  capability reflects `permissions.allowed_tools` [CR1].
- User rules → `~/.config/crush/CRUSH.md` (or `~/.config/AGENTS.md`), not
  `~/.config/crush/AGENTS.md` [CR1][CR2].

## E8.S9 · continue — MCP retarget, rules home, prompts on

A: DEV · P: §2/Continue fixtures. Findings: §3/continue d1–d3.
✓:

- MCP emits to `.continue/mcpServers/mcp.json` (foreign-format autodetect home) OR as a
  `mcpServers` LIST block in a config.yaml carrying required `name`/`version`/`schema` — never a
  map-shaped whole-file clobber of the user's config.yaml [CT4][CT1].
- Rules → `.continue/rules/*.md`; the undocumented root/`~/.continue/AGENTS.md` write is gone
  [CT2].
- Prompts capability on: `.continue/prompts/*.md` with `invokable: true` [CT3].

## E8.S10 · aider — functional conventions wiring (or roster call — ELICIT-5)

A: DEV · P: §2/aider fixture. Findings: §3/aider d1, d3.
✓:

- Compile emits the conventions file AND a `.aider.conf.yml` containing `read: [<file>]` (merge-
  safe with an existing conf per E3.S5); a stock aider run actually loads the rules [AI1][AI2].
- `~/AGENTS.md` user-scope write is gone. Scope chain home→git-root→cwd modeled on read [AI1].
- If ELICIT-5 resolves to retire: this story voids and the roster change lands in E10.S5 instead.
