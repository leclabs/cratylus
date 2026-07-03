# E5 · plugin-adapters — deliver resources through a harness's plugin architecture

Floor: **F5** (harness lacks native support for a resource but HAS a plugin architecture ⇒ the
adapter delivers the resource via a plugin artifact). Resource floor: **agents + skills**;
nice-to-have: **hooks**; recorded-as-FUTURE: tools, MCP-delivery. ρ=LLM.
Verified plugin architectures (RETURN §1/§2 + pi RETURN §3): opencode JS/TS plugins [OC5] · Amp
Bun-TS plugins [AM2] · Kilo TS plugins [KL6] · Cline SDK `AgentPlugin` [CL8] · Claude plugins
[CC4][CC5] · Gemini extensions [GM6] · Zed WASM extensions (MCP-only delivery) [ZD7] · **Pi TS
extensions + pi packages** [PI3][PI6]. Pi is the DEMONSTRATION instance of plugin-delivered
capabilities (Operator ruling); its ground truth = `../completed/pi-harness-research.RETURN.md`
(`[PI#]` refs resolve there) — E5.S8 is live; roster stories E10.S8–S10.

---

## E5.S1 · support mode `plugin` is a first-class capability value

A: DEV · G: the adapter contract can say "delivered via plugin", distinct from `full/partial/none`.
P: contract + `agent-forge adapters` output.
✓:

- Capability declarations admit `plugin` (or `{level, via: 'plugin'}`) per resource; `agent-forge
adapters` renders it distinctly; engine routes such resources to the adapter's plugin emitter.
- A resource declared `plugin` with no plugin emitter is a lint error at adapter load, not a
  runtime surprise.

## E5.S2 · agents via plugin where file-config agents are absent — Amp

A: FLEET · G: an IR agent reaches Amp although Amp has no agent _file_ dialect (agents are
built-ins + `amp.createAgent()` plugin API [AM1][AM9]).
P: IR agent (name, description, body/system-prompt, model); target amp.
✓:

- Compile emits `.amp/plugins/agent-forge-agents.ts` (project) / `~/.config/amp/plugins/…` (user)
  default-exporting a function that calls `amp.createAgent()` once per IR agent with name +
  system prompt mapped; file passes `bun build --no-bundle`-level syntax/type check in CI.
- IR fields Amp's API cannot carry are warned per E4.S2 discipline.

## E5.S3 · skills floor is met natively everywhere a plugin arch exists — negative guard

A: DEV · G: prove the skills half of the F5 floor is already discharged by native paths, so no
skill-plugin shim is built where a cheaper native path exists (parsimony guard).
P: RETURN §1 skills column for every plugin-arch harness (opencode, Amp, Kilo, Cline, Claude,
Gemini, Zed).
✓:

- A pinned assertion table: each plugin-arch harness has native `SKILL.md` discovery
  ([OC6][AM4][KL3][CL5][CC3][GM3][ZD2] · Pi [PI5]); the adapters emit skills to those native
  paths; no skill-via-plugin code path exists.
- If a future harness shows plugin-arch + no native skills, this story's table forces a conscious
  revisit (the guard fails on roster change, prompting a new story — not silence).

## E5.S4 · hooks via plugin events — opencode + Kilo (NICE-TO-HAVE)

A: FLEET · G: IR hooks reach harnesses whose only hook surface is the plugin event system.
P: IR hook (canonical PreToolUse, command payload); targets opencode [OC5], kilo [KL6].
✓:

- opencode: compile emits `.opencode/plugins/agent-forge-hooks.ts` exporting a
  `tool.execute.before` handler that shells the IR command; only the event names verified in
  [OC5] (`tool.execute.before/after`, `session.created`, `file.edited`) are mapped; unverified
  names (§3/opencode d5) are excluded until re-verified.
- kilo: equivalent artifact against `@kilocode/plugin` lifecycle hooks [KL6].
- Canonical events with no verified plugin equivalent land in `.skipped` by name.

## E5.S5 · Claude plugin as a bundling target

A: FLEET · G: one IR compiles to a distributable Claude plugin (the plugin arch used as a
_carrier_, closing §3/claude d6 "plugins unmodeled" on the write side).
P: IR with skills + agents + hooks + mcp servers; a `--as-plugin <name>` (or manifest override)
compile mode for target claude.
✓:

- Output tree: `.claude-plugin/plugin.json` (`name` required [CC4]) + `skills/` + `agents/` +
  `hooks/hooks.json` + `.mcp.json`, matching the documented component layout [CC4][CC5];
  `${CLAUDE_PLUGIN_ROOT}` used for intra-plugin paths where the docs prescribe it.
- The plugin dir passes Claude Code's own load (smoke: `claude --plugin-dir` class check or
  documented structural validation).

## E5.S6 · tools + MCP-delivery via plugins — recorded as FUTURE

A: OPERATOR · G: the deferred half of F5 is on the record with scope, not forgotten.
P: this story file.
✓:

- Status `FUTURE` is explicit here and in COVERAGE.md; excluded from the coverage-test wave.
- Scope recorded: custom tools via opencode plugin `tool` key [OC5], Kilo `ToolDefinition` [KL6],
  Cline SDK tools [CL8], Amp `registerTool` [AM2]; MCP-server delivery via Zed extensions [ZD7] +
  Gemini extensions [GM6]. No implementation story may claim F5-tools until this graduates.

## E5.S7 · no-native + no-plugin ⇒ loud skip, never fabrication

A: OWNER · G: a resource that has neither surface on a target is skipped with a reason.
P: IR agent; target crush (no custom agents, no plugin API — open FR [CR4]).
✓:

- Compile emits **no** agent artifact for crush; `.skipped` entry: {resource, target: crush,
  reason citing no-native-no-plugin}; `--strict` behavior documented (skip is a warning-class,
  configurable).

## E5.S8 · Pi — the live demonstration of plugin-delivered capabilities

A: FLEET · G: Pi demonstrates F5 end-to-end — a harness that deliberately omits hooks, subagents,
and permissions as config-file surfaces and designates TS extensions + pi packages as the
delivery path [PI2 §Philosophy] receives the agents floor and the hooks nice-to-have from IR as
generated code.
P: pi RETURN §2/§3 fixtures; IR with 1 agent + hooks on canonical PreToolUse (blocking),
PostToolUse, SessionStart, UserPromptSubmit.
✓:

- Skills floor: discharged natively, no plugin shim (E5.S3 guard) — emitted to `.agents/skills/`,
  which pi discovers cwd→ancestors plus `~/.agents/skills/` [PI5]; emissions keep name = dirname
  (spec-strict) even though pi tolerates the deviation [PI5].
- Agents via code: the adapter emits the subagent pattern — agent defs as md+frontmatter
  (name/description/tools/model + body = system prompt) at `.pi/agents/*.md` (project) /
  `~/.pi/agent/agents/*.md` (user) plus a `registerTool` delegate extension per the official
  subagent example [PI9]; emitted TS type-checks in CI.
- Hooks via events: generated extension maps canonical events onto `pi.on()` (the ~30-event set
  [PI3]): PreToolUse→`tool_call` with veto shape `{block: true, reason}` · PostToolUse→
  `tool_result` · SessionStart→`session_start` · UserPromptSubmit→`input`; canonical events with
  no [PI3]-verified equivalent land in `.skipped` by name (E4.S4 discipline).
- Packaging: the code artifacts ship as ONE pi package — `package.json` with
  `"keywords": ["pi-package"]` + `"pi"` manifest listing `extensions` [PI6]; installable via
  `pi install ./<path>` (local, path-referenced).
- Trust gating loud: the WriteReport warns that project-scope emissions (`.pi/*`,
  `.agents/skills/`) are INERT until the folder is trusted (`~/.pi/agent/trust.json`, `/trust`)
  [PI2 §Project Trust]; absence of that warning on any project-scope pi write = FAIL.
