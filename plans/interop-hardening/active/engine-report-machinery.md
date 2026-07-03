# engine-report-machinery — reports name every loss; engine mechanisms the adapters build on

**Lane** Mav · **wave(4)** · deps: none (root).

## Static

- `packages/agent-forge/src/core/engine/{compile,drift,io,merge,migrate,paths}.ts` · `src/core/adapter/types.ts` · `src/cli/commands/{compile,import,diff,lint,doctor}.ts` · `src/cli/index.ts`
- `packages/agent-forge/test/stories/E1/{E1.S1,E1.S4,E1.S7}.test.ts` · `E2/{e2s5-local-compile,e2s7-walkup}.test.ts` · `E3/{e3s1-own-format,e3s2-fixpoint,e3s4-drift,e3s6-refusal}.test.ts` · `E5/{S1.plugin-support-mode,S7.loud-skip}.test.ts` · `E7/s01-agents-md-canonical.test.ts` · `E9/read-merge.test.ts`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`
- `plans/interop-hardening/stories/{E1-harness-import,E2-ir-emission,E3-reimport,E5-plugin-adapters,E7-standards-reach,E9-ir-expressiveness}.md`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §3 Cross-cutting (engine/IR level)

## Scope

Change class: **engine feature + report-surface fix**. Territory: `src/core/engine/**` · `src/core/adapter/types.ts` · `src/cli/**`. Adapter files only for the hook-id seam below (safe: this wave completes before any adapter shard dispatches).

- **Import report**: unrepresentable-source-field entries (path + field); machine-parseable `unsupported-by-source` status for absent source capability; `unlifted-surfaces` listing for present-but-unconsumed fixture files (generic unconsumed-file detection at import).
- **Compile report**: resolved IR path named in dry-run; per-resource `no-local-tier` skipped entries + paired elicit entries (target · resource · resolution question); no fabricated file for targets lacking a documented local tier; skip-reason vocabulary gains `no-native-no-plugin` (replaces bare `unsupported` where no native surface and no plugin emitter exist).
- **Own-format import**: `import --from <dir>/.agent-forge` copies foreign IR into the local home; source untouched; lint passes.
- **Drift**: `manifest options.drift_check` enforced (`error` refuses naming the drifted file; `warn` proceeds with warning); drift report names resource id; recompile over drifted managed content reports the conflict, never silently reclaims.
- **Refusals**: corrupt-resource refusal names the offending file path; version-skew refusal names found-vs-supported and points at `agent-forge migrate`.
- **Plugin support mode**: capability declarations admit `plugin`; engine routes plugin-declared resources to a plugin emitter; adapter-load lint error when `plugin` is declared with no emitter. Mechanism only — no adapter gains `plugin` here.
- **Rule order**: engine sorts rules by `rule.order` before emission (E7.S1 concat order).
- **Hook-id stability**: stable id policy across compile→import (derivation or preservation); confined per-adapter touches to hook-id lines in `src/adapters/{claude,cursor,gemini}/{read,write}.ts` only.
- **Managed-region / merge primitives** (exported, for w5/w6 adapter shards): marker-delimited md regions, key-scoped JSON merge, YAML merge. Primitives only — per-adapter application is owned by the adapter shards; do not flip their ids.

## Owned tracked ids (19)

| Story | Test (call site)                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| E1.S1 | `import report names every unrepresentable source field (agent permissionMode: path + field)`                     |
| E1.S4 | `import aider reports mcp_servers/agents/skills as unsupported-by-source, not omission [AI3][AI5]`                |
| E1.S7 | `${spec.label}: every fixture file imported or reported under unlifted-surfaces ${spec.ref}`                      |
| E2.S5 | `targets without a documented local tier emit per-resource skipped entries with reason no-local-tier`             |
| E2.S5 | `a target lacking a local tier never gets a fabricated file (emulation is not invented)`                          |
| E2.S5 | `the report carries an elicit entry (target · resource · resolution question) per no-local-tier skip`             |
| E2.S7 | `the dry-run report names the resolved IR path (<root>/.agent-forge)`                                             |
| E3.S1 | `import --from <otherRepo>/.agent-forge copies the foreign IR into the local home; lint passes; source unchanged` |
| E3.S2 | `${adapter.id}: hook ids survive the compile→import cycle (no undeclared loss)`                                   |
| E3.S4 | `manifest options.drift_check: 'error' makes compile refuse, naming the drifted file`                             |
| E3.S4 | `manifest options.drift_check: 'warn' proceeds but emits a drift warning`                                         |
| E3.S4 | `the drift report names the resource id, not just the file path`                                                  |
| E3.S6 | `corrupt resource file: the refusal names the offending file path`                                                |
| E3.S6 | `version-skew refusal names found vs supported version and points at agent-forge migrate`                         |
| E5.S1 | `capability declarations admit plugin and the engine routes plugin resources to a plugin emitter`                 |
| E5.S1 | `a resource declared plugin with no plugin emitter is a lint error at adapter load`                               |
| E5.S7 | `the skipped reason cites no-native-no-plugin, not a bare unsupported`                                            |
| E7.S1 | `root AGENTS.md concatenates rules by the rule.schema order field, not array order`                               |
| E9.S4 | `recompile over drifted managed content reports the conflict instead of silently reclaiming (E3.S4 discipline)`   |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken; zero non-owned `story.tracked` flips (foreign flip = scope breach).
- Story ground: mapped stories' observable acceptance holds driven end-to-end (real `import`/`compile` runs against the tests' fixtures, reports inspected) — a green test over still-broken observable behavior = fail.
- Territory: production diff confined to declared territory + the hook-id seam; graduation flips are the only test edits.
