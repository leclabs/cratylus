# roster-metadata — canonical ids, aliases, per-adapter status (antigravity · devin · roo sunset)

**Lane** Nico (naming/roster surface) · **wave(6)** · deps: ⊳devin-adapter (the `devin` canonical id must resolve to a shipped adapter).

## Static

- `packages/agent-forge/src/cli/index.ts` (the `adapters[]` roster) · `src/core/adapter/types.ts` (Adapter contract — status/alias fields land here or beside it)
- `plans/interop-hardening/completed/harness-landscape-research.RETURN.md` §0 field state + §2 ([GM7] gemini→Antigravity · [WS7] windsurf→Devin · [RO5] Roo archived→Kilo/cline pointer)
- `packages/agent-forge/test/stories/E10/S5.renames.test.ts` · `plans/interop-hardening/stories/E10-adapter-roster.md` (E10.S5)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`

## Scope

Change class: **roster/naming feature**. Territory: roster + adapter-id/alias/status metadata (`src/cli/index.ts`, `src/core/adapter/types.ts`, per-adapter `index.ts` id/alias lines only — no dialect logic).

- Canonical id `antigravity`; `gemini` resolves to the identical adapter [GM7].
- Canonical id `devin`; `windsurf` resolves to the identical adapter [WS7].
- Per-adapter status metadata on the roster (current¦renamed¦sunset…, per the test's read) [GM7][WS7][RO5].
- `roo` carries sunset status pointing at `cline` [RO5].
- Naming is the deliverable: alias direction (canonical vs deprecated) follows the RETURN-sheet field state, never the legacy id's familiarity.

## Owned tracked ids (4)

| Story  | Test (call site)                                                                  |
| ------ | --------------------------------------------------------------------------------- |
| E10.S5 | `canonical id antigravity exists; gemini resolves to the identical adapter [GM7]` |
| E10.S5 | `canonical id devin exists; windsurf resolves to the identical adapter [WS7]`     |
| E10.S5 | `per-adapter status metadata exists on the roster [GM7][WS7][RO5]`                |
| E10.S5 | `roo carries sunset status pointing at cline [RO5]`                               |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (CLI `adapters`/`events --client` listings still resolve every legacy id); zero non-owned `story.tracked` flips.
- Story ground: `agent-forge adapters` (and import/compile `--client`) accept both canonical and alias ids and print status; alias and canonical produce byte-identical output for the same IR.
- Territory: production diff confined to roster/metadata surfaces; graduation flips are the only test edits.
