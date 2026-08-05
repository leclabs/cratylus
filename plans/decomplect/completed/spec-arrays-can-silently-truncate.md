# A scripted edit truncated five `outputs` arrays, and every gate stayed green

> Found 2026-08-05 mid-execution, by noticing a shard's `writes` block looked shorter than what
> I had authored. Nothing else would have found it.

## What happened

Clearing the `blockedBy` fields from `spec.mjs` used a line-oriented script. It matched more than
it meant to and removed **16 array entries** across the file. Six of those removals were my own
deliberate later edits; **ten were silent damage** to five shards:

| shard                                  | lost                            |
| -------------------------------------- | ------------------------------- |
| `t-anatomy-root-compose`               | 4 of 7 output entries           |
| `t-worker-payload-seam-and-property-1` | its 3 `canon/test` gate files   |
| `t-policy-seam-unused`                 | the whole `cold-oracle/**` half |
| `t-canon-package-default`              | `forge/test/cli/**`             |
| `t-soul-to-target-in-forge`            | `project/index.ts`              |

## Why nothing caught it — and this is the point

`praxis-execution-spec.test.ts` has a leg asserting **every output glob resolves to something
tracked**. That catches a _wrong_ entry. It cannot catch a _missing_ one, because a shorter array
is still a valid array of resolving globs.

**Completeness is not checkable from the spec alone.** And an incomplete `outputs` is not cosmetic:
it is the contention set. Every wave-disjointness proof computed between the truncation and its
discovery ran on data that understated what shards write — the gate was green about a question it
was no longer really asking.

Two shards executed under the damaged data (`t-anatomy-root-compose`, `t-canon-package-default`)
and both agents wrote files their spec no longer declared. No collision occurred, but only because
they ran alone in their file neighbourhoods — the proof that protected them was not sound at the
time it was relied on.

## The fix that would actually bind

`outputs` becomes checkable the moment a shard lands: **the set of files a shard's landing commit
touched must be a subset of its declared outputs.** That is computable from git, it convicts both
an under-declared array and an out-of-scope edit, and it turns `outputs` from an authored claim
into a measured fact.

The manual version of this check is what caught the `t-manifest-file-basename` border crossing
earlier today — it worked, and it should not depend on someone remembering to run it.

## Acceptance

- A gate compares each completed shard's landing diff against its declared `outputs`, and convicts
  on either direction — a file written but not declared, or a declared glob that the shard never
  touched (the second is a weaker signal and may warn rather than fail).
- Both fixtures: a synthetic shard whose commit strays outside its outputs, and one that stays in.
- Structured data stops being edited by line-oriented scripts — or the editor asserts the parsed
  shape is unchanged except where intended. **A round-trip parse assertion after any scripted edit
  to `spec.mjs`** is the cheap version and would have caught this immediately.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** plan-machinery · **wave** 0
- **depends on** —
- **writes** `packages/canon/test/praxis-execution-spec.test.ts`
- **compiles against** `packages/canon/src/toolkit/plan-set.ts`
- **evidence** `packages/canon/test/praxis-execution-spec.test.ts`
- **dispatchable** no ruling owed
