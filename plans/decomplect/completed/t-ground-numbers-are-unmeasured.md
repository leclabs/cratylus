# Four load-bearing numbers in ground and plan are wrong, and one was never measured at all

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

Cheapest shard here and among the most valuable: ground is read as authority, and every one of these
was quoted forward without recomputation. **`ARCHITECTURE.md` is a MUST-READ in `AGENTS.md`** — a
wrong number there is read by every agent at session start.

| site                                 | says                                                  | truth                                                               |
| ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------- |
| `ARCHITECTURE.md:256`                | `anatomy.ts` has **154** importers                    | **177** files (171 `src` + 6 `test`)                                |
| `ARCHITECTURE.md:260`                | `FIXTURE_ANATOMY` at **~110** sites                   | **75**, across 17 files                                             |
| `PLAN.md:135`                        | gate acceptance `build scripts 6 · root 1`            | `architecture.test.ts:375-399` asserts **build scripts 4 · root 0** |
| `ARCHITECTURE.md:259`, `PLAN.md:263` | breaching import at `memory-consolidation-nudge.ts:2` | it is at **`:1`**; `:2` is the schema import                        |

## The `~110` is the interesting one

It was **75 at `48baaddd`** — the very commit that wrote `~110` into `ARCHITECTURE.md`. It was never
75-and-then-drifted. **It was never measured.** Nearest reconstruction of an intended number: all
`anatomy`-family tokens in `forge/test` = 138; `fixture-anatomy` module references = 44. Neither is 110. Same species as the "28" this plan already caught.

## Constraints

- Recompute in the same breath as writing. Put the command beside the number.
- Do **not** silently correct `PLAN.md:135` — an acceptance criterion that changed value is a record
  of a gate that moved, and the movement should be readable.

## Acceptance

- Each number carries the command that produced it.
- A follow-on question is filed, not answered here: **can a gate hold a prose number to a live
  count?** Four wrong figures in ground is a class, not four incidents.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** corpus-rename · **wave** 1
- **depends on** `t-manifest-file-basename`
- **writes** `ARCHITECTURE.md`
- **compiles against** `packages/canon/test/architecture.test.ts`
- **evidence** `ARCHITECTURE.md` · `packages/canon/test/architecture.test.ts`
- **dispatchable** no ruling owed
