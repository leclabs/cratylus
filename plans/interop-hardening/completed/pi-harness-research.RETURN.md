# pi-harness-research — RETURN (2026-07-02, ρ=LLM)

Web-audited ground truth for the **Pi** coding-agent harness, from primary sources only (repo
README/docs/examples fetched raw off `main`, the author's blog, npm registry, GitHub API). Citation
keys `[PI#]` resolve in §5 Sources. `UNVERIFIED` = could not be confirmed from a fetched source;
never guessed. Format extends `../completed/harness-landscape-research.RETURN.md` (same matrix
columns/legend, same sheet fixture-precision).

## §0 Identity — pinned

- **Canonical referent**: the minimal, extensible coding-agent harness created by **Mario Zechner
  (GitHub `badlogic`, creator of libGDX)**, announced 2025-11-30 [PI10]. Candidate referent in the
  contract CONFIRMED.
- **Canonical repo**: **https://github.com/earendil-works/pi** (monorepo; the harness proper is
  `packages/coding-agent`). The original `github.com/badlogic/pi-mono` now redirects there: Zechner
  joined **Earendil** (PBC co-founded by Armin Ronacher) 2026-04-08 and brought pi with him [PI11];
  GitHub API confirms `full_name: earendil-works/pi`, MIT, description "AI agent toolkit: unified
  LLM API, agent loop, TUI, coding agent CLI" [PI1].
- **Canonical docs**: https://pi.dev → `pi.dev/docs/latest` (rendered from
  `packages/coding-agent/docs/*.md` in-repo) [PI12][PI1].
- **npm**: `@earendil-works/pi-coding-agent` (bin `pi`; latest **0.80.3** at fetch time). The
  pre-move package `@mariozechner/pi-coding-agent` is deprecated with message "please use
  @earendil-works/pi-coding-agent instead going forward" (last release 0.73.1, 2026-05-07) — the
  npm registry itself pins the succession [PI13].
- **Monorepo packages**: `pi-ai` (unified multi-provider LLM API), `pi-agent-core` (agent runtime:
  tool calling + state), `pi-coding-agent` (the CLI harness), `pi-tui` (differential-rendering
  terminal UI) [PI1][PI10].
- **Disambiguation** (why this "Pi" and not another): Inflection AI's "Pi" is a consumer chatbot,
  not a harness; `oh-my-pi` (can1357, + az9713 fork) is a downstream **fork of this pi** adding MCP
  resilience etc. — derivative, not the referent. Only earendil-works/pi is an extensible
  coding-agent harness with a plugin (extension/package) architecture; the name was chosen to be
  "entirely un-Google-able" [PI10].
- **Thesis** (shapes every row below): "Pi is a minimal agent harness. Adapt Pi to your workflows,
  not the other way around" [PI12]. Deliberate omissions, each with a designated extension path:
  **No MCP** ("Build CLI tools with READMEs (see Skills), or build an extension that adds MCP
  support"), **No sub-agents** ("Spawn pi instances via tmux, or build your own with extensions, or
  install a package"), **No permission popups** ("Run in a container, or build your own
  confirmation flow with extensions") [PI2 §Philosophy, verbatim]. No plan mode, no built-in
  to-dos, no background bash — same rationale [PI10]. No built-in permission system; recommended
  hardening is containerization (Gondolin extension / Docker / sandbox) [PI1][PI8].

## §1 Landscape-matrix row

Legend (identical to landscape RETURN §1): ✔ full · ◐ partial/qualified · ✖ absent · † legacy/retired.

| Harness | Agents/subagents                                                                                                                                                                                         | Skills                                                                                                                                                                                             | Rules/instructions                                                                                                                                                                   | Hooks                                                                                                                                                                                                   | Slash-cmds                                                                                                                                                                | Custom tools                                                                                                                                          | MCP                                                                                                                                                                                                       | Scopes                                                                                                                                                                                  | Plugin arch                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pi**  | ✖ native (deliberate); ◐ via official `subagent/` example extension: `~/.pi/agent/agents/*.md` + `.pi/agents/*.md` (md+frontmatter), spawns `pi` subprocesses, parallel ≤8 tasks/4 concurrent [PI2][PI9] | ✔ Agent Skills standard; `~/.pi/agent/skills/`, `~/.agents/skills/`, `.pi/skills/`, `.agents/skills/` (cwd walk-up) + packages/settings/CLI; documented deviation: name≠dirname allowed [PI2][PI5] | ✔ AGENTS.md **or CLAUDE.md**: `~/.pi/agent/AGENTS.md` + parent dirs (walk-up) + cwd, all CONCATENATED; plus `SYSTEM.md` (replace) / `APPEND_SYSTEM.md` (append) at both scopes [PI2] | ✖ config-file hooks; ✔ in-process extension events (~30: `tool_call` block, `tool_result` mutate, `before_agent_start`, `context`, `session_*`, `input`, `user_bash`, `before_provider_request`…) [PI3] | ✔ prompt templates `~/.pi/agent/prompts/*.md`, `.pi/prompts/*.md` → `/name` (`$1`, `$ARGUMENTS`, `${1:-def}`); `/skill:name`; extension `registerCommand` [PI2][PI7][PI3] | ✔ extension `pi.registerTool()` (TypeBox schema, streaming updates, custom rendering, may override built-ins read/bash/edit/write/grep/find/ls) [PI3] | ✖ deliberate ("No MCP"); extension path named in README ("MCP server integration" listed as an extension use case); no first-party MCP extension shipped — UNVERIFIED any official one exists [PI2][PI14] | global `~/.pi/agent/` (relocate via `PI_CODING_AGENT_DIR`) / project `.pi/` (trust-gated via `~/.pi/agent/trust.json`); project overrides global, nested objects deep-merged [PI2][PI4] | ✔ TS extensions (`~/.pi/agent/extensions/`, `.pi/extensions/`, `-e` flag) + **pi packages** (npm/git/local; `package.json` `"pi"` key; carry extensions+skills+prompts+themes) [PI3][PI6] |

**Standards posture** (standards-compat matrix codes: ✓ native · fb fallback · cfg · ln · ✗ · U):
AGENTS.md **✓ native** incl. nested walk-up + global, concatenation semantics [PI2] · CLAUDE.md
**✓ native** (co-equal alternative filename, same discovery) [PI2] · Agent Skills SKILL.md **✓**
(implements agentskills.io spec; one documented deviation: "Pi allows skill names to differ from
their parent directory even though the standard disallows it") [PI5] · `.agents/skills/` **✓**
(`~/.agents/skills/` + `.agents/skills/` cwd→ancestors) [PI2][PI5] · `.claude/skills` **✗** (not in
the documented path set [PI5]; sibling repo `badlogic/pi-skills` ships skills "compatible with
Claude Code and Codex CLI" — portability by authoring convention, not by path cross-read) [PI15] ·
`.claude/rules/` **✗ native / ◐ example** (`claude-rules.ts` example extension "Scans
`.claude/rules/` folder and lists rules in system prompt") [PI8] · MCP **✗ by design** [PI2][PI14].

## §2 Config-contract sheet (fixture-precision)

### Pi (pi-coding-agent)

- **Scopes/precedence**: global `~/.pi/agent/` (override dir via env `PI_CODING_AGENT_DIR`);
  project `.pi/` in cwd. Project settings override global; "Nested objects are merged" (deep-merge,
  not replace) [PI2][PI4]. **Trust gate**: on interactive startup pi prompts before trusting a
  folder containing project-local settings/resources/`.agents/skills`; decisions persist in
  `~/.pi/agent/trust.json` (written by `/trust`, includes parent-folder trust; restart required).
  Pre-trust, only context files + user/global extensions + CLI `-e` extensions load (so they can
  handle the `project_trust` event). Non-interactive modes (`-p`, `--mode json`, `--mode rpc`)
  never prompt — they follow global `defaultProjectTrust` (`ask`(=ignore)/`always`/`never`);
  one-run override `--approve`/`-a`, `--no-approve`/`-na` [PI2 §Project Trust, verbatim-checked].
- **Settings**: `~/.pi/agent/settings.json` (global) < `.pi/settings.json` (project). Keys (from
  docs/settings.md): `defaultProvider`, `defaultModel`, `defaultThinkingLevel`
  (off|minimal|low|medium|high|xhigh), `thinkingBudgets`, `hideThinkingBlock`, `theme` (default
  "dark"), `externalEditor`, `quietStartup`, `defaultProjectTrust` (global-only, default "ask"),
  `enableInstallTelemetry` (default true), `enableAnalytics`, `httpProxy` (global-only),
  `compaction.{enabled,reserveTokens:16384,keepRecentTokens:20000}`,
  `branchSummary.{reserveTokens,skipPrompt}`, `retry.{enabled,maxRetries:3,baseDelayMs:2000,…}`,
  `steeringMode`/`followUpMode` (one-at-a-time|all), `transport` (auto|sse|websocket),
  `shellPath`, `shellCommandPrefix`, `npmCommand` (argv array, e.g.
  `["mise","exec","node@20","--","npm"]`), `sessionDir`, `enabledModels` (patterns for Ctrl+P
  cycling), and the **resource keys**: `packages` (array), `extensions`/`skills`/`prompts`/`themes`
  (string[] paths or dirs), `enableSkillCommands` (default true) [PI4][PI2].
- **Rules/context files**: verbatim — "Pi loads `AGENTS.md` (or `CLAUDE.md`) at startup from:
  `~/.pi/agent/AGENTS.md` (global) · Parent directories (walking up from cwd) · Current directory …
  All matching files are concatenated." Disable: `--no-context-files`/`-nc` [PI2 L316-323]. NOTE:
  there is **no** `.pi/AGENTS.md` surface — project context is plain root/ancestor
  AGENTS.md|CLAUDE.md. **System prompt**: replace with `.pi/SYSTEM.md` (project) or
  `~/.pi/agent/SYSTEM.md` (global); append via `APPEND_SYSTEM.md` at either scope [PI2 L327].
  Default system prompt is <1000 tokens [PI10].
- **Skills**: dirs containing `SKILL.md` discovered recursively at `~/.pi/agent/skills/`,
  `~/.agents/skills/`, `.pi/skills/` (trust-gated), `.agents/skills/` (cwd up through ancestors,
  trust-gated); bare `*.md` files also accepted directly in `~/.pi/agent/skills/` and
  `.pi/skills/`; plus package `skills/` dirs / `pi.skills` manifest entries, settings `skills`
  array, CLI `--skill <path>` (`--no-skills` disables discovery but explicit `--skill` still
  loads). Frontmatter: `name` (required; ≤64 chars, `[a-z0-9-]`; **may differ from dirname** —
  documented spec deviation), `description` (required, ≤1024 chars; "Skills with missing
  description are not loaded"), `license`, `compatibility` (≤500), `allowed-tools`,
  `disable-model-invocation` (hide from system prompt), `metadata`. Loading = progressive
  disclosure: startup scan puts name+description **in XML form in the system prompt**; agent
  `read`s the full SKILL.md on match. Invocation: model-driven, or `/skill:name [args]` (args
  appended as "User: <args>"; gated by `enableSkillCommands`). Collisions: first found wins +
  warning [PI5][PI2].
- **Prompt templates** (the slash-command surface): `~/.pi/agent/prompts/*.md`, `.pi/prompts/*.md`
  (trust-gated), package `prompts/`, settings `prompts` array, `--prompt-template <path>`;
  non-recursive discovery; filename minus `.md` = `/name`. Frontmatter `description` (falls back to
  first non-empty line), `argument-hint`. Substitution: `$1..$n`, `$@`/`$ARGUMENTS`,
  `${1:-default}`, `${@:N}`, `${@:N:L}` [PI7][PI2].
- **Extensions**: `~/.pi/agent/extensions/*.ts` or `*/index.ts`; `.pi/extensions/` same shapes
  (trust-gated); settings `extensions` array; CLI `-e/--extension`. A module default-exports
  `(pi: ExtensionAPI) => void | Promise<void>` (async factories complete before `session_start`).
  Full API in §3. Hot path: `/reload` reloads keybindings/extensions/skills/prompts/context files;
  themes hot-reload automatically [PI3][PI2].
- **Pi packages** (the distribution unit): `pi install npm:@scope/pkg[@ver] | git:host/user/repo[@ref]
| https://… | ssh://… | ./local/path`; installs land `~/.pi/agent/npm/` / `~/.pi/agent/git/<host>/<path>`
  (global) or `.pi/npm/`, `.pi/git/` with `-l`; local installs are path-referenced, not copied.
  Manifest: `package.json` with `"keywords": ["pi-package"]` and
  `"pi": {"extensions": ["./extensions"], "skills": ["./skills"], "prompts": ["./prompts"], "themes": ["./themes"]}`
  (globs + `!exclusions`; conventional dirs auto-discovered if the `pi` key is omitted). Settings
  `packages` entries are string shortcuts or filter objects
  `{"source":"npm:…","extensions":[…],"skills":[],"prompts":[…],"themes":["+…"]}` (`!` exclude, `+`
  force-include, `-` force-exclude); same package in both scopes ⇒ project entry wins. Packages run
  with full system access — review before install [PI6][PI2].
- **Models/providers**: `~/.pi/agent/models.json` adds providers speaking a supported API
  (OpenAI/Anthropic/Google); custom APIs/OAuth via extension `registerProvider` [PI2][PI3].
- **Themes**: JSON files at `~/.pi/agent/themes/`, `.pi/themes/`, packages; built-ins dark/light;
  hot-reload on file change [PI2].
- **Other surfaces**: `~/.pi/agent/keybindings.json`; sessions auto-save as branching JSONL
  (`id`/`parentId` tree) under `~/.pi/agent/sessions/` by cwd, `sessionDir` overrides; modes:
  interactive TUI, `-p/--print`, `--mode json` (JSONL event stream), `--mode rpc` (strict
  LF-delimited JSONL on stdin/stdout), TS SDK; built-in tools read/write/edit/bash (+ read-only
  grep/find/ls) gated by `--tools`/`--exclude-tools`/`--no-builtin-tools`/`--no-tools`; update
  check hits `pi.dev/api/latest-version` (`PI_SKIP_VERSION_CHECK=1`), install telemetry
  `enableInstallTelemetry`/`PI_TELEMETRY=0` [PI2][PI4].
- **Auto-load shape (context consumed at session start)**: default system prompt (or
  SYSTEM.md/APPEND_SYSTEM.md) + tool prompt snippets/guidelines + skills name+description XML block
  - concatenated AGENTS.md/CLAUDE.md chain (global → ancestors → cwd) + prompt-template and
    extension registrations (metadata only); skill bodies and CLI-tool READMEs are read on demand by
    the model — "give the model the absolute minimum it needs to be useful" [PI2][PI5][PI10].

## §3 Plugin-arch capability map

Pi's plugin architecture = **TypeScript extensions** (in-process, full `ExtensionAPI`) +
**pi packages** (npm/git-distributed bundles of extensions/skills/prompts/themes) [PI3][PI6].
Extensions are the designated mechanism for every capability pi omits — this is the roster's
demonstration case. What a pi extension can reach:

**Injection/interception points** [PI3]: register via `pi.on(event, handler)` —
lifecycle `project_trust`, `session_start` (reasons startup|reload|new|resume|fork),
`session_shutdown`, `session_before_switch|fork|compact`, `session_info_changed`; turn-level
`before_agent_start` (inject messages / modify system prompt), `agent_start|end`, `turn_start|end`,
`context` (mutate the message array non-destructively before every LLM call); message-level
`message_start|update|end`, `tool_execution_start|update|end`; tool gates `tool_call` (return
`{block:true, reason}` to veto) and `tool_result` (rewrite results); input `input` (transform/
handle raw user input), `user_bash` (intercept `!`/`!!`); provider wire `before_provider_request`
(rewrite payload), `after_provider_response`; `model_select`, `thinking_level_select`. Plus
registration APIs: `registerTool`, `registerCommand`, `registerShortcut`, `registerFlag`,
`registerProvider`, `registerMessageRenderer`/`registerEntryRenderer`; context/messaging
`pi.sendMessage` (`deliverAs: steer|followUp|nextTurn`), `pi.sendUserMessage`, `pi.appendEntry`
(persisted, non-context); session control `ctx.newSession/fork/navigateTree/switchSession/reload`,
read access via `ctx.sessionManager`; full TUI toolkit (`ctx.ui.*` dialogs, widgets, custom
editors/footers, overlays); resource loading at runtime (`resources_discover` — the
`dynamic-resources` example "Loads skills, prompts, and themes") [PI3][PI8].

Per common capability — can a pi plugin deliver it, and via what mechanism:

| Capability                                                 | Deliverable by plugin?                                       | Mechanism (cited)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agents/subagents**                                       | **YES** — proven by official example                         | `registerTool` exposing a delegate tool that "executes a separate `pi` subprocess with a delegated system prompt and tool/model configuration"; agent defs = md+YAML frontmatter (name/description/tools/model + body=system prompt) at `~/.pi/agent/agents/*.md` (always) and `.pi/agents/*.md` (per `agentScope`, project wins on name clash when `"both"`; `confirmProjectAgents` gate); single/parallel(≤8 tasks, 4 concurrent)/chained modes [PI9]. SDK embedding is the alternative in-process route [PI2].                 |
| **Skills**                                                 | **YES** — native + plugin-extendable                         | Skills are native (§2); a plugin extends the surface three ways: pi packages carry `skills/` dirs [PI6]; settings `skills` array adds foreign dirs (documented use: point at shared dirs used by Claude Code/Codex) [PI5]; extensions load skills at runtime via `resources_discover` [PI8].                                                                                                                                                                                                                                      |
| **Rules**                                                  | **YES**                                                      | Native AGENTS.md/CLAUDE.md chain (§2); beyond it, extensions inject rule content via `before_agent_start` (system-prompt modification; `pirate.ts` demonstrates `systemPromptAppend`) or the `context` event; foreign dialects bridgeable — `claude-rules.ts` example "Scans `.claude/rules/` folder and lists rules in system prompt" [PI3][PI8].                                                                                                                                                                                |
| **Hooks**                                                  | **YES** (as in-process events, not shell hook files)         | The `pi.on()` event set IS the hook system: pre/post tool (`tool_call` veto / `tool_result` mutate), session lifecycle, prompt-submit (`input`), compaction (`session_before_compact`, custom compaction example), provider request/response. No exec-a-shell-command hook config exists natively; an extension can trivially shell out inside any handler (e.g. `bash-spawn-hook.ts`, `git-checkpoint.ts` examples) [PI3][PI8].                                                                                                  |
| **Custom tools**                                           | **YES** — first-class                                        | `pi.registerTool({name,label,description,promptSnippet,promptGuidelines,parameters:TypeBox,execute(…),renderCall,renderResult})`; may override built-ins by name; streaming `onUpdate`; `terminate:true` ends the turn; `executionMode:"sequential"` available [PI3][PI8].                                                                                                                                                                                                                                                        |
| **MCP**                                                    | **YES in principle (mechanism named), no verified artifact** | README: extension use-case list includes "MCP server integration"; philosophy: "No MCP. Build CLI tools with READMEs (see Skills), or build an extension that adds MCP support" [PI2]. Mechanism: an extension is arbitrary TS with npm deps (`with-deps` example) — wrap an MCP client, surface each MCP tool via `registerTool`. No first-party MCP extension in the repo examples; existence of a maintained third-party pi-package for MCP: UNVERIFIED (the `oh-my-pi` fork hard-codes MCP support downstream instead) [PI8]. |
| **Slash-commands**                                         | **YES**                                                      | Two plugin routes: markdown prompt templates in packages (`pi.prompts`) [PI6][PI7]; programmatic `pi.registerCommand(name,{description,getArgumentCompletions,handler})` with full command context (fork/newSession/navigateTree/…) [PI3].                                                                                                                                                                                                                                                                                        |
| **Permissions/safety** (bonus row — pi's loudest omission) | **YES**                                                      | `tool_call` veto + `ctx.ui.confirm` (examples: `permission-gate.ts`, `protected-paths.ts`, `tool-override.ts`); OS-level via `sandbox/` (`@anthropic-ai/sandbox-runtime`) and `gondolin/` micro-VM examples [PI3][PI8].                                                                                                                                                                                                                                                                                                           |
| **Providers/models**                                       | **YES**                                                      | `pi.registerProvider` (baseUrl, api dialect, OAuth) / `pi.unregisterProvider`; `models.json` for declarative cases [PI3][PI2].                                                                                                                                                                                                                                                                                                                                                                                                    |
| **UI/themes/status**                                       | **YES**                                                      | `ctx.ui.*` (dialogs, widgets, status, custom editor/footer/header, overlays incl. full-screen custom components); themes as package assets [PI3][PI6].                                                                                                                                                                                                                                                                                                                                                                            |

**Reading for agent-forge**: pi has no config-file dialect for hooks, subagents, permissions, or
MCP to serialize into — those capabilities are delivered as **code** (a pi package). A pi adapter's
natural emissions are: AGENTS.md (native, concatenated walk-up — same file the R1 strategy already
produces), skills to `.agents/skills/` (native, spec-aligned — R2 lands unchanged; pi even tolerates
name≠dir), prompt templates (`.pi/prompts/*.md`, near-trivial), and optionally a generated
`.pi/settings.json` + a pi-package manifest for anything hook/agent/tool-shaped. Trust gating means
project-scope emissions (`.pi/*`, `.agents/skills/`) are inert until the user trusts the folder
[PI2][PI5][PI6].

## §4 Fixture-readiness

Blind-fixture status: **Pi ✔** — every §2 surface names exact path(s) per scope, format,
frontmatter/keys, precedence, and substitution grammar (settings.json keys [PI4], AGENTS.md chain
verbatim [PI2], SKILL.md frontmatter table [PI5], prompt-template frontmatter+args [PI7],
package.json `pi` manifest + filter syntax [PI6], extension module shape + import paths [PI3],
trust.json semantics [PI2]). Residual UNVERIFIED: exact JSON schema of `trust.json` entries; theme
JSON key set (docs/themes.md not fetched — format asserted JSON by [PI2][PI6]); any official MCP
extension package; `subagent/` example's full frontmatter field list beyond
name/description/tools/model [PI9]. Volatility note: pre-1.0 (0.80.x), fast-moving — re-verify
paths against [PI2] before cutting fixtures into tests.

## §5 Sources

- PI1 https://github.com/earendil-works/pi (+ GitHub API `repos/earendil-works/pi`, fetched 2026-07-02; `badlogic/pi-mono` redirects here)
- PI2 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md (raw fetch 2026-07-02; line refs to that snapshot)
- PI3 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md
- PI4 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/settings.md
- PI5 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md
- PI6 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md
- PI7 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/prompt-templates.md
- PI8 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/README.md
- PI9 https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/subagent/README.md
- PI10 https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ ("What I learned building an opinionated and minimal coding agent")
- PI11 https://mariozechner.at/posts/2026-04-08-ive-sold-out/ (Earendil move; corroborated first-hand by PI1 redirect + PI13 deprecation)
- PI12 https://pi.dev/ (fetched 2026-07-02) · docs hub https://pi.dev/docs/latest
- PI13 npm registry: registry.npmjs.org/@earendil-works/pi-coding-agent (latest 0.80.3) and registry.npmjs.org/@mariozechner/pi-coding-agent (0.73.1 deprecated "please use @earendil-works/pi-coding-agent instead going forward"), fetched 2026-07-02
- PI14 https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/ (MCP-omission rationale, linked from PI2)
- PI15 https://github.com/badlogic/pi-skills ("Skills for pi coding agent (compatible with Claude Code and Codex CLI)")
