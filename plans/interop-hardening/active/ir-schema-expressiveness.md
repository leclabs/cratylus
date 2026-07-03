# ir-schema-expressiveness — the IR represents every documented dialect field

**Lane** Mav · **wave(4)** · deps: none (root).

## Static

- `packages/agent-forge/src/core/schema/{mcp-server,rule,agent,skill}.schema.json` + `src/core/ir/generated.ts` (regen: `pnpm gen`; schema is source of truth, never hand-edit generated)
- `packages/agent-forge/test/stories/E9/{mcp-dialects,rule-activation,agent-skill-surface}.test.ts` · `test/stories/E7/s07-vendor-rules-dirs.test.ts`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` (graduation protocol, header) · `test/stories/MAP.md`
- `plans/interop-hardening/stories/E9-ir-expressiveness.md` · `stories/E7-standards-reach.md`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 sheets + §3 (field refs [OC7][KL5][CX7][CL6][GM1][CU5][CC2][KL1][OC2][GM2][CU3][CP1][S3][CC3][CU4][CR1][S19][WS1][CL1][CP3][CT2])

## Scope

Change class: **schema extension** (additive; existing IR trees keep validating — the green companion tests in the same files pin that). Territory: `src/core/schema/**` · `src/core/ir/**` (regenerated) · `src/core/serialize/**` + validators as touched by new fields. NOT `src/adapters/**`.

Extend:

- `McpServer`: command-as-array form, `bearer_token_env_var`/`http_headers`, `disabled`/`autoApprove`, `includeTools`/`excludeTools`/`trust`/`timeout`, cursor `auth` (per E9.S1 test's ref table).
- `Rule`: activation/placement metadata — `description` · `globs` · `activation` (enum `always¦auto¦glob¦manual`) · `dir` (+ `alwaysApply` expressibility per E7.S7).
- `Agent`: `permission_mode`, `max_turns`, `temperature`, `mode` (enum `primary¦subagent¦all`), `memory`, `effort`.
- `Skill`: `license`, `compatibility`, `metadata`, `paths`, `user_invocable`, `disable_model_invocation`.

## Owned tracked ids (7)

| Story | Test (call site)                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| E9.S1 | `schema represents ${name} ${ref}`                                                                                              |
| E9.S2 | `activation metadata validates: description + globs + activation + dir [WS1][CL1][CP3][CT2][CU1][CC1]`                          |
| E9.S2 | `each documented activation mode is schema-representable (always¦auto¦glob¦manual)`                                             |
| E9.S6 | `agent schema represents permission_mode, max_turns, temperature, mode, memory, effort [CC2][KL1][OC2][GM2][CU3][CP1]`          |
| E9.S6 | `agent mode carries the documented enum primary¦subagent¦all [KL1][OC2]`                                                        |
| E9.S6 | `skill schema represents license, compatibility, metadata, paths, user_invocable, disable_model_invocation [S3][CC3][CU4][CR1]` |
| E7.S7 | `IR Rule carries activation metadata (globs/alwaysApply) so vendor dirs are compilable — schema rejects it today (E9 gap)`      |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story` at its call site; its TRACKED-FAILING.md row deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `test/stories/coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` call sites flipped (foreign flip = scope breach — return naming the id).
- Story ground: E9.S1/S2/S6 + E7.S7 observable acceptance holds — the new fields survive `writeIR → readIR` value-identical (drive it, not just the suite); plain resources without the new metadata validate exactly as before.
- Territory: production diff confined to declared territory; the graduation flip is the only test edit.
