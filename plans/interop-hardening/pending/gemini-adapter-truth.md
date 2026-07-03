# gemini-adapter-truth — GEMINI.md context, honest commands, MCP url/httpUrl, regex matchers (§3 gemini d1–d7)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (McpServer `includeTools`/`excludeTools`/`trust`/`timeout`).

## Static

- `packages/agent-forge/src/adapters/gemini/{anatomy,events,paths,read,write}.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Gemini CLI (→ Antigravity CLI)" + §3 "gemini adapter" ([GM1][GM4][GM5])
- `packages/agent-forge/test/stories/E8/S3.gemini.test.ts` · `E7/s06-mcp-dialects.test.ts`
- `plans/interop-hardening/stories/E8-divergence-fixes.md` (E8.S3) · `stories/E7-standards-reach.md` (E7.S6)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **divergence fix**. Territory: `src/adapters/gemini/**`.

- Rules: project rules → `GEMINI.md` (stock context filename); bare AGENTS.md only with `context.fileName` wiring; GEMINI.md lifts on read [GM1].
- Commands: capability on — `.gemini/commands/*.toml` with required `prompt` key; `commands: none` retired [GM5].
- MCP: SSE → `url` (no fabricated `type`); streamable-HTTP → `httpUrl`, never `url` [GM1][S11].
- Settings: no fabricated permissions/env keys emitted; fabricated-shape import lifts zero phantoms [GM1].
- Hooks/events: `BeforeToolSelection` in the event map; matchers declared regex, not glob [GM4].

## Owned tracked ids (12)

| Story | Test (call site)                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------- |
| E8.S3 | `project rules emit to GEMINI.md, the stock context filename [GM1]`                               |
| E8.S3 | `a stock install reads the result: bare AGENTS.md requires context.fileName wiring [GM1]`         |
| E8.S3 | `GEMINI.md fixture lifts as rules on read [GM1]`                                                  |
| E8.S3 | `commands capability on: .gemini/commands/*.toml with required prompt key [GM5]`                  |
| E8.S3 | `capabilities no longer declare commands: none [GM5]`                                             |
| E8.S3 | `SSE remote MCP emits url without the fabricated type key [GM1]`                                  |
| E8.S3 | `streamable-HTTP remote MCP emits httpUrl, not url [GM1]`                                         |
| E8.S3 | `no fabricated permissions/env settings.json keys are emitted [GM1]`                              |
| E8.S3 | `event map includes the documented BeforeToolSelection event [GM4]`                               |
| E8.S3 | `hook capability declares regex matchers, not glob [GM4]`                                         |
| E8.S3 | `fabricated-shape import: settings.json permissions/env are not lifted as phantoms (E1.S3) [GM1]` |
| E7.S6 | `gemini: streamable-HTTP server uses httpUrl, url is SSE-only [S11] (§3 gemini d5)`               |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E8.S3 green: hook entries shape; E7.S6 green: `.gemini/settings.json mcpServers` stdio); zero non-owned `story.tracked` flips (E4.S5 regex-declaration and E9.S3 table call sites span other adapters — owned by `convergence-graduation`; verify they stay tracked).
- Story ground: drive compile+import per §2 sheet; a stock-gemini-readable tree is the observable (GEMINI.md present, transports keyed right).
- Territory: production diff confined to `src/adapters/gemini/**`; graduation flips are the only test edits.
