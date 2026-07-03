# zed-adapter — new config adapter: Zed (AGENTS.md · .agents/skills · context_servers)

**Lane** Mav · **wave(4)** · deps: none (new owned paths; needs no schema/engine change).

## Static

- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Zed" sheet + §1 matrix Zed row (refs [ZD1]–[ZD8])
- `packages/agent-forge/test/stories/E10/S2.zed.test.ts` · `plans/interop-hardening/stories/E10-adapter-roster.md` (E10.S2)
- `packages/agent-forge/src/core/adapter/types.ts` (Adapter contract) · exemplar `src/adapters/crush/**` (anatomy/events/paths/read/write/index shape)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **feature (new adapter)**. Owned paths: new `src/adapters/zed/**` + append-only roster seam (`src/cli/index.ts` import + `adapters[]` entry; subpath export in `package.json` per the existing per-adapter pattern).

- Rules: AGENTS.md written; shadow warning when a higher-precedence file exists [ZD1].
- Skills: exactly `<worktree>/.agents/skills/` (no other project path) [ZD2]; frontmatter constraints enforced (name ≤64 `[a-z0-9-]`, description <1024B).
- MCP: `context_servers` in `.zed/settings.json` [ZD3].
- Capabilities honest: hooks/commands/agents `none` [ZD5][ZD8][ZD4][ZD6].

## Owned tracked ids (6)

| Story  | Test (call site)                                                                            |
| ------ | ------------------------------------------------------------------------------------------- |
| E10.S2 | `zed is on the adapter roster (new-adapter contract)`                                       |
| E10.S2 | `skills emit to exactly <worktree>/.agents/skills/ — Zed reads no other project path [ZD2]` |
| E10.S2 | `skill frontmatter constraints enforced: name ≤64 [a-z0-9-], description <1024B [ZD2]`      |
| E10.S2 | `rules: AGENTS.md written with a shadow warning when a higher-precedence file exists [ZD1]` |
| E10.S2 | `MCP emits as context_servers in .zed/settings.json [ZD3]`                                  |
| E10.S2 | `capabilities honest: hooks/commands/agents declared none [ZD5][ZD8][ZD4][ZD6]`             |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` flips. NOTE: `E5/S3.skills-native-guard.test.ts` id `amp / kilo / zed: …no shipped adapter at all` stays tracked until amp+kilo also ship (owned by `convergence-graduation`) — verify this shard alone does not flip it; if zed alone flips it, coordinate with the judge, never edit that call site.
- Story ground: E10.S2 observable acceptance holds — compile a full IR against a zed target and inspect the emitted tree (paths, constraints, warnings).
- Owned paths: production diff confined to `src/adapters/zed/**` + declared seams; graduation flips are the only test edits.
