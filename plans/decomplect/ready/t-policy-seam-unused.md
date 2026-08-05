# Four doctrine constants sit in forge beside a working injection seam and none goes through it

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## The premise this was filed on is CORRECTED

`PLAN.md` says these sit _"beside an **empty** `Policy` injection seam"_. The seam is **not empty**.
`forge/src/validate/policy.ts:35-39` declares 3 members; `canon/src/toolkit/cold-oracle/policy.ts:16-20`
supplies all 3 as `canonPolicy`; it is threaded through **17 live call sites** in canon's tests and
read by both consuming gates (`accept.ts:161`, `residue.ts:74`).

**That makes this easier, not harder.** The mechanism is built, exercised, and has a corpus-side
home. The defect is that four doctrine-bearing constants sit next to it and use it for nothing.

## The four

| item                    | site                                     | what is baked                                                                                                                                                       |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| σ\* register thresholds | `core/exemplify/register.ts:41-49`       | `hits ≥ 3`, density `≥ 0.02`                                                                                                                                        |
| `HUMAN_MARKERS`         | `core/exemplify/register.ts:15-29`       | 13 English regexes — an English-corpus lexicon                                                                                                                      |
| `NO_PRIOR`              | `validate/oracle.ts:52-61`               | 8 regexes — **and the module already proves the pattern**: `:17-19` injects `scriptPath` as the corpus-coupled datum, then bakes the decode lexicon two lines later |
| parsimony classes       | `validate/structural-parsimony.ts:45-54` | named for THIS corpus's history, and the parsers hardcode canon's tree shape (`DIMENSION_IMPORT` at `:91-92`, `MARK_FIELD` at `:96`)                                |

Each has ~3 consumer sites. `NO_PRIOR` is the cleanest first cut — its own file already shows the shape.

## Constraints

- **Take them one at a time.** Solving a constraint system one constraint at a time is this plan's
  recorded failure mode only when the constraints interact; these four are independent, and a single
  bulk move would obscure which consumer broke.
- Parsimony classes are the **weakest case** — their three classes are historical cruft names. If the
  right answer is deletion rather than injection, say so and stop.

## Acceptance

- Each moved constant is supplied by `canonPolicy` and forge holds no corpus-specific default for it.
- Render oracle unmoved. Both gates (`accept`, `residue`) still convict their fixtures.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** forge-seams · **wave** 1
- **depends on** `t-manifest-file-basename` · `t-soul-to-target-in-forge`
- **writes** `packages/forge/src/validate/policy.ts` · `packages/forge/src/validate/oracle.ts` · `packages/forge/src/validate/structural-parsimony.ts` · `packages/canon/src/toolkit/cold-oracle/**`
- **compiles against** `packages/forge/src/core/exemplify/register.ts`
- **evidence** `packages/forge/src/validate/policy.ts` · `packages/canon/src/toolkit/cold-oracle/policy.ts`
- **dispatchable** no ruling owed
