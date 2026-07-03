# codex-adapter-truth — codex emits/reads only documented surfaces (§3 codex d1–d6)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (McpServer `bearer_token_env_var`/`http_headers`).

## Static

- `packages/agent-forge/src/adapters/codex/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Codex CLI" + §3 "codex adapter" ([CX1]–[CX7])
- `packages/agent-forge/test/stories/E8/S2.codex.test.ts` · `E7/s06-mcp-dialects.test.ts` · `E4/event-taxonomy.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S2) · `stories/E7-standards-reach.md` (E7.S6) · `stories/E4-roundtrip.md` (E4.S4)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/codex/**`.

- Skills: project → `.agents/skills/`, user → `~/.agents/skills/`; nothing to `.codex/skills/` or `~/.codex/skills/` [CX2].
- Agent TOML: documented `developer_instructions`; no fabricated `system_prompt`/`tools`/`color` [CX1].
- Hooks/events: no `[features] codex_hooks` gate; event map excludes `PermissionRequest`, covers `PreCompact`/`PostCompact` [CX4].
- Permissions/env: no fabricated TOML keys emitted; fabricated-shape import lifts zero phantoms [CX6].
- MCP: remote entry `url` + `bearer_token_env_var`/`http_headers` only — no `type` key; SSE inexpressible ⇒ warn per E4.S2, never silently emitted [CX7][S47].
- Read: `AGENTS.override.md` lifts over `AGENTS.md` [CX3].

## Owned tracked ids (16)

| Story | Test (call site)                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| E8.S2 | `project skills emit to .agents/skills/ [CX2]`                                                               |
| E8.S2 | `nothing is emitted to .codex/skills/ [CX2]`                                                                 |
| E8.S2 | `user skills emit to ~/.agents/skills/ [CX2]`                                                                |
| E8.S2 | `nothing is emitted to ~/.codex/skills/ [CX2]`                                                               |
| E8.S2 | `agent TOML uses documented developer_instructions field [CX1]`                                              |
| E8.S2 | `agent TOML carries no fabricated system_prompt/tools/color keys [CX1]`                                      |
| E8.S2 | `no fabricated [features] codex_hooks gate is emitted [CX4]`                                                 |
| E8.S2 | `event map excludes undocumented PermissionRequest [CX4]`                                                    |
| E8.S2 | `event map covers the documented PreCompact/PostCompact events [CX4]`                                        |
| E8.S2 | `no fabricated permissions/env TOML keys are emitted [CX6]`                                                  |
| E8.S2 | `remote MCP emits url without the undocumented type key, no SSE [CX7]`                                       |
| E8.S2 | `read lifts AGENTS.override.md over AGENTS.md [CX3]`                                                         |
| E8.S2 | `fabricated-shape import: permissions/env TOML tables lift zero phantom resources (E1.S3) [CX6]`             |
| E7.S6 | `codex: remote entry carries no type key — url + bearer_token_env_var/http_headers only [S47] (§3 codex d6)` |
| E7.S6 | `codex: SSE transport is inexpressible in the dialect and must warn per E4.S2 [S47]`                         |
| E4.S4 | `codex: fabricated PermissionRequest is gone (documented set is 7 events) [CX4]`                             |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S2 greens: hooks tables, rules+stdio round-trip; E4.S4 greens: case-exact documented subset); zero non-owned `story.tracked` flips.
- Story ground: drive compile+import on codex fixtures per §2 sheet; inspect emitted TOML/trees and lifted IR — observable behavior per E8.S2/E7.S6/E4.S4 story acceptance.
- Territory: production diff confined to `src/adapters/codex/**`; graduation flips are the only test edits.
