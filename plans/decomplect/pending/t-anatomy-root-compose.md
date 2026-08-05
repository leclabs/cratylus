# `anatomyRoot` — a locus named for a metaphor, and the predicate was never asked

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

18 sites / 8 files. **Every one is `join(anatomyRoot, …)`; zero ask a predicate.** Its siblings
`repoRoot` / `srcRoot` / `renderRoot` co-occur in the same statements
(`plan-set.ts:67-70`, `project-targets.ts:28-31`, `scaffold-cli.ts:18-19`), which is what makes the
target determinate: it is the same `⊕σ*` composition the neighbours already use.

## Measured

`anatomyRoot` **18 sites / 8 files** — the sweep said 19 files, `PLAN.md` said 10; **both wrong**.
Plus 5 sites of `anatomyProjectTemplate` / `scaffoldAnatomyProject`
(`project-template.ts:83`, `scaffold-cli.ts:15,58,66,76`, `cratylism.test.ts:271-276`).

## Constraints

- Mechanical `⊕σ*` composition against the existing `*Root` family. **No mint.**
- The 5 `anatomyProjectTemplate` sites move in the same act — same concept, same metaphor.
- `cratylism.test.ts:271-276` names the identifier; it moves with it.

## Acceptance

- No identifier under `packages/` composes `anatomy` with a locus or template sense.
- Render oracle unmoved. Suite green uncached.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** plan-machinery · **wave** 1
- **depends on** `t-manifest-file-basename`
- **writes** `packages/canon/src/toolkit/plan-set.ts` · `packages/canon/src/toolkit/project-targets.ts` · `packages/canon/src/toolkit/project-template.ts`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/canon/src/toolkit/plan-set.ts` · `packages/canon/src/toolkit/scaffold-cli.ts`
- **dispatchable** no ruling owed
