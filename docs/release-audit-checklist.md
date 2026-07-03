# Release-audit checklist — per-adapter re-verification

Dated: 2026-07-03. Re-run before any release that touches adapters: each row's contract sheet
(`plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2) is re-checked against
the harness's current docs; UNVERIFIED items below are the standing re-verification set — each
listed exactly once, retired only by a primary source.

| Adapter    | Re-verify                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aider`    | `.aider.conf.yml` `read:` wiring remains the sole context path; no new discovery surfaces                                                                                             |
| `claude`   | CLAUDE.md-not-AGENTS.md premise — tripwire row: E7.S10 carries it in CI (see `docs/claude-agents-md-assumption.md`)                                                                   |
| `cline`    | rules dirs + `~/.agents/AGENTS.md` global surface unchanged                                                                                                                           |
| `codex`    | agent TOML field syntax — exact `[agents]` TOML example absent from docs, syntax UNVERIFIED [CX1]                                                                                     |
| `continue` | `.continue/rules/` frontmatter (globs/alwaysApply) current [CT2]; AGENTS.md consumption still unconfirmed                                                                             |
| `copilot`  | hook dialect (camelCase JSON) + instructions tiers current                                                                                                                            |
| `crush`    | `crush.json` `mcp` key + permissions shape current                                                                                                                                    |
| `cursor`   | `.mdc` rules frontmatter + `"version": 1` requirement current                                                                                                                         |
| `gemini`   | Antigravity transition status — surfaces carried over, ids/aliases correct                                                                                                            |
| `opencode` | scope deep-merge order (remote/global/env/project/managed/MDM) current [OC2]                                                                                                          |
| `zed`      | `.agents/skills/` remains the sole project skills path [ZD2]; `context_servers` settings key current [ZD3]; slash-command removal stands [ZD8]                                        |
| `devin`    | `.devin/rules/` trigger frontmatter + 12k cap current [WS1]; hooks.json 12-event dialect current [WS2]; Devin Local subagent file config remains announcement-level, UNVERIFIED [WS7] |
| `amp`      | Plugin API surface (`createAgent`/`registerCommand`/`on()`) current post-"neo" [AM2][AM3]; `amp.mcpServers` flat-key shape + `.agents/skills/` native path unchanged [AM1][AM4]       |

Any row failing re-verification opens an RTB task naming the drifted claim and its sheet line.
