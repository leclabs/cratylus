# The sign is `manifest`; the module is still `anatomy.ts`

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

`48baaddd` landed the sign — `type Anatomy` returns **0 hits**, `DimensionManifest` and `MANIFEST`
are live. The **file basename never moved**. A module named for a refuted metaphor is the one place
a corpus about naming cannot afford to carry one.

## Measured

| what                                   | count                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| files importing `canon/src/anatomy.ts` | **177** (171 `src` + 6 `test`)                                                    |
| `FIXTURE_ANATOMY`                      | **75** occurrences / 17 files, all `forge/test`                                   |
| `anatomy` as a forge PARAMETER name    | 6 sites (`adapters/claude/anatomy.ts:62,68,95,100`, `core/anatomy-body.ts:41,53`) |

## Constraints

- **Nothing to decide.** `manifest` was round-tripped and `ARCHITECTURE.md:118-119` already ratifies
  it — ground no longer carries the refuted sign.
- `FIXTURE_ANATOMY` and the forge parameter names are the SAME concept and move in the same act.
  Renaming the module and leaving the fixture is how a palimpsest re-forms.
- The forge files `adapters/*/anatomy.ts` and `core/anatomy-body.ts` are a **different concept**
  (harness projection) and are **out of scope** — they wait on `t-projection-file-anchor`.

## Acceptance

- `git mv` + specifier rewrite; `grep -rl "anatomy" packages/canon/src` returns nothing.
- **Render oracle UNMOVED.** No projected bytes are involved, so any movement is a real defect —
  find it, do not re-baseline.
- Suite green uncached.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** corpus-rename · **wave** 0
- **depends on** —
- **writes** `packages/canon/src/**` · `packages/canon/test/**` · `packages/forge/test/fixture-anatomy.ts`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/canon/src/anatomy.ts` · `ARCHITECTURE.md`
- **dispatchable** no ruling owed
