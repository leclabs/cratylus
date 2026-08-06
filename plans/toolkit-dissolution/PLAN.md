# toolkit-dissolution

> `packages/canon/src/toolkit/` is a residue directory. Under this corpus's First Principle,
> "the leftovers" is the one thing a name may not be.

`mirror(state, R, content)` — generated view.

## Why

41 files. **0 imported by any other package**, 0 re-exported from canon's index, none built
(`tsconfig.build.json` excludes `src/toolkit/**`), none shipped (`files: ["dist"]`). 67
references from 35 files reach into it, 8 of them from repo-root `package.json` scripts and
`.husky/post-commit` — a repo-root script `sh`-execing a published package's
excluded-from-build source subtree.

Two reasons `src/` is the wrong home, neither about breaking changes:

1. `src/` asserts _"this becomes `dist`"_. A subtree the build explicitly excludes makes the
   directory name false — a self-refutation three levels above `cratylism.ts`.
2. It is typechecked under `tsconfig.json` and built under `tsconfig.build.json`, whose
   `exclude` sets can drift with nothing convicting them.

**And 9 of the 41 files are generated.** `guardrail/*.sh` + `continuity/*.sh` — 1,242 lines —
are written out by `project-targets.ts` from `workers[].content` template literals in
`src/hooks/*.ts`, to `targetPath`s pointing back into `src/toolkit/`. That is a second,
unnamed render tree committed into a package's source directory.

## The cut is deliberately SERIAL, and that is a ruling not an oversight

Praxis warns that a singleton non-terminal wave is a chain rather than a cut. This plan is a
chain on purpose: **root `package.json` is a shared output of four of the five shards** (7 of
its 26 scripts reach into `src/toolkit/`), so the concurrency precondition
`outputs(t) ∩ outputs(u) = ∅` genuinely cannot hold across them. Declaring a parallel cut
here would be a fiction that produces contention on the first dispatch.

Every shard must leave the tree GREEN — `pnpm verify` + `pnpm typecheck:test` — because a
refactor whose intermediate states are red cannot be bisected.

## R

`t-dead-and-tests → t-meaning-uplift → t-mechanism-rehome → t-build-scripts → t-generated-shell`

## Shards

| state   | task                 | concern                                                              |
| ------- | -------------------- | -------------------------------------------------------------------- |
| ready   | `t-dead-and-tests`   | delete the dead file; move 11 test files + fixtures to the test tree |
| pending | `t-meaning-uplift`   | 5 canon-meaning modules up one level, out of `toolkit/`              |
| pending | `t-mechanism-rehome` | mechanism → runtime; validation gates → forge; scaffold → invoke     |
| pending | `t-build-scripts`    | repo build tooling → repo-root `scripts/`                            |
| pending | `t-generated-shell`  | the 9 generated `.sh` stop being committed into `src/`               |

## What is NOT in this plan

The guardrail workers' **source** — 1,339 lines of shell embedded as template literals in
`src/hooks/*.ts` — is a real violation of _"a skill that embeds its own implementation has
fused meaning with mechanism"_. `memory-consolidation-nudge` shows the right shape (72 lines
shelling to a runtime bin); `stance-guardrail.sh` at 466 lines does not. The fix is a runtime
stance-guard capability with a thin projected face. Separate plan — it is a redesign, not a
relocation, and mixing the two would make neither reviewable.

## Where the operator's hypothesis was wrong, recorded so it is not re-litigated

`plan-states.ts`, `operator-lexicon.ts`, `project-template.ts` and `cold-oracle/policy.ts`
are canon **meaning**, zero mechanism. `runtime/carry-on/terminus.ts` deliberately NAMES
`plan-states` in prose rather than importing it, because canon and runtime must share no
edge — moving it to runtime would invert ARCHITECTURE property 1. They go up one level, not
across. Likewise `render-oracle.sh` / `project-targets*` / `sweep.mjs` are repo build tooling,
not skill mechanism.
