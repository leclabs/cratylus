# convergence-graduation — the cross-adapter equations close: honesty tables, round-trip matrix, portable core, import completeness

**Lane** Mav · **wave(7)** · deps: ⊳claude-mcp-rehoming ⊳claude-surfaces ⊳codex-adapter-truth ⊳gemini-adapter-truth ⊳copilot-adapter-truth ⊳cursor-adapter-truth ⊳opencode-adapter-truth ⊳cline-adapter-truth ⊳crush-adapter-truth ⊳continue-adapter-truth ⊳aider-adapter-truth ⊳amp-adapter ⊳kilo-adapter ⊳zed-adapter.

## Static

- `packages/agent-forge/test/stories/E1/{E1.S2,E1.S3}.test.ts` · `E2/e2s3-project-compile.test.ts` · `E4/{roundtrip-matrix,capability-honesty,matcher-semantics,portable-core}.test.ts` · `E5/S3.skills-native-guard.test.ts` · `E9/hook-capability-truth.test.ts`
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §1 matrix + §2 sheets + §3 per-adapter divergence lists (the ground truth every equation quantifies over)
- `plans/interop-hardening/stories/{E1-harness-import,E2-ir-emission,E4-roundtrip,E5-plugin-adapters,E9-ir-expressiveness}.md`
- `packages/agent-forge/src/adapters/**` (post-wave-5/6 state — read-mostly) · `src/core/engine/**`
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **residual fix + graduation of cross-adapter parametrized call sites**. These call sites quantify over MANY adapters — each only graduates when every covered adapter is true, so ownership converges here after the per-adapter waves. Work = run each owned test, fix the residue it still names (any territory, now uncontended — waves 5/6 complete), flip.

Expected residue classes (not exhaustive — the tests decide): cursor/crush `matchers: regex` + copilot/gemini/cline `payload` declaration cells not covered by a per-adapter id (E4.S5/E9.S3); remote-MCP `headers` read-side lift on the 5-adapter matrix (E4.S1); stale/over-claim capability cells the per-adapter shards missed (E4.S3 two-sided honesty vs §1/§2); aider portable-core discipline — documented-absence skips, not warnings (E4.S7 zero-warnings 10/10); per-adapter importer completeness + fabricated-path silence residues (E1.S2/E1.S3 across the §3 ref sets); touched-path ⊆ documented-surfaces union (E2.S3); the amp/kilo/zed shipped-roster guard (E5.S3).

## Owned tracked ids (11)

| Story | Test (call site)                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1.S2 | `import ${spec.client}: every documented resource class lifts from a §2-truth fixture (gap: ${spec.gap})`                                                                 |
| E1.S3 | `${spec.client} ${spec.path}: zero ${spec.resource} imported from the fabricated path ${spec.ref}`                                                                        |
| E1.S3 | `${spec.client} ${spec.path}: import report warns naming the unrecognized path ${spec.ref}`                                                                               |
| E2.S3 | `touched-path set ⊆ union of documented per-adapter project surfaces (no fabricated paths)`                                                                               |
| E4.S1 | `${adapterId}/${type}: import(compile(r)) ≡ r (remote-mcp headers dropped on read)`                                                                                       |
| E4.S3 | `stale cells: opencode agents+commands, cline skills+workflows, cursor/copilot/continue/gemini commands, continue permissions, crush hooks+permissions declared honestly` |
| E4.S3 | `over-claim cells retired: cline permissions+env, crush env, opencode env no longer claim undocumented surfaces [OC1][CL1][CL2][CR1]`                                     |
| E4.S5 | `regex-dialect targets declare matchers: regex — claude [CC6], gemini [GM4], cursor [CU2], crush [CR3]`                                                                   |
| E4.S7 | `all 10 targets compile the portable core with zero warnings and zero skips (aider drops skills+mcp [AI1][AI5]; cline and continue drop skills [CL5][CT3])`               |
| E5.S3 | `amp / kilo / zed: plugin-arch harnesses with native skills paths have no shipped adapter at all`                                                                         |
| E9.S3 | `declaration table ≡ ground truth for every classified cell (regex matchers + native payloads still shipped wrong)`                                                       |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. **Terminal condition: TRACKED-FAILING.md enumerates 0 call sites** — any survivor must be FUTURE-class with a written basis, else fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken.
- Story ground: the closed equations are the observable — capability declarations ≡ documented reality both directions; round-trip matrix classification complete; portable core warning-free 10/10 driven end-to-end.
- Territory: any residue fix is fair game (uncontended wave), but each production change must trace to a named owned id; graduation flips are the only test edits.
