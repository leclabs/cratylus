# kilo-adapter — new adapter: Kilo (.kilo/\* homes, kilo.jsonc MCP, @kilocode/plugin lifecycle hooks)

**Lane** Mav · **wave(5)** · deps: ⊳ir-schema-expressiveness (McpServer command-as-ARRAY [KL5]) · ⊳engine-report-machinery (plugin route for the hook-plugin artifact).

## Static

- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §2 "Roo Code († archived) / Kilo" + §1 matrix Kilo row ([KL1]–[KL7])
- `packages/agent-forge/test/stories/E10/S4.kilo.test.ts` · `E5/S4.hook-plugins.test.ts`
- `plans/interop-hardening/stories/E10-adapter-roster.md` (E10.S4) · `stories/E5-plugin-adapters.md` (E5.S4)
- `packages/agent-forge/src/core/adapter/types.ts` · exemplars `src/adapters/crush/**` + `src/adapters/opencode/**` (hook-plugin shim pattern)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **feature (new adapter)**. Territory: new `src/adapters/kilo/**` + append-only roster seam (`src/cli/index.ts`, `package.json` subpath export).

- Roster: kilo registered per the new-adapter contract [KL1].
- Homes: rules → `.kilo/rules/`, commands → `.kilo/commands/`, skills → `.kilo/skills/` [KL2][KL7][KL3]; agents → `.kilo/agents/*.md` with `mode:` frontmatter [KL1].
- MCP: `kilo.jsonc` typed `local¦remote` with command as ARRAY [KL5].
- Legacy: `.kilocode/*` recognized on import, never written [KL1].
- Hooks: hook-plugin artifact against `@kilocode/plugin` lifecycle hooks [KL6] via the wave-4 plugin route.

## Owned tracked ids (6)

| Story  | Test (call site)                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------- |
| E10.S4 | `kilo is on the adapter roster (new-adapter contract) [KL1]`                                         |
| E10.S4 | `MCP lands in kilo.jsonc typed local¦remote with command as ARRAY (E9.S1) [KL5]`                     |
| E10.S4 | `agents emit to .kilo/agents/*.md with mode: frontmatter [KL1]`                                      |
| E10.S4 | `rules → .kilo/rules/, commands → .kilo/commands/, skills → .kilo/skills/ [KL2][KL7][KL3]`           |
| E10.S4 | `legacy .kilocode/* is recognized on import but never written [KL1]`                                 |
| E5.S4  | `kilo: an equivalent hook-plugin artifact is emitted against @kilocode/plugin lifecycle hooks [KL6]` |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` flips (`E5/S3` amp/kilo/zed call site is convergence-owned; E10.S5 roo-sunset metadata is roster-metadata-owned).
- Story ground: drive compile+import per §2 sheet; observable = `.kilo/*` tree + `kilo.jsonc` a stock Kilo reads; legacy import lifts without writing `.kilocode/`.
- Territory: production diff confined to `src/adapters/kilo/**` + declared seams; graduation flips are the only test edits.
