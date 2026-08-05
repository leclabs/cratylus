# Two lines in `init.ts` hardcode `.claude`, and the sibling file already has the parameter

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

`forge/src/deploy/init.ts:76-77` hardcode `'.claude'` for `agents/` and `skills/` with **no
parameter at all** — `ScaffoldProjectOpts` (`:40-49`) has no harness field. Meanwhile
`forge/src/deploy/scope.ts:50,71` carries the same fact as a defaulted parameter
(`harnessHome = '.claude'`). One file solved it; its neighbour did not.

## Scope, stated so the number is not misread

28 `.claude` literals exist in `forge/src`. The ones under `adapters/claude/` are **correct by
construction**. **This shard is exactly the 2 in `init.ts`.**

## Already discharged, do not redo

The doctrine half of the old B-row filing is gone: `init.ts:14-18` and `project-template.ts` make it
`ProjectTemplate`-injected, and canon supplies its own (`canon/src/toolkit/project-template.ts`).

## Acceptance

- `init.ts` takes the harness home as a defaulted parameter, matching `scope.ts`'s existing shape.
- A non-claude scaffold puts its dirs where that harness wants them, proven by a test.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** forge-deploy · **wave** 1
- **depends on** `t-soul-to-target-in-forge`
- **writes** `packages/forge/src/deploy/init.ts`
- **compiles against** `packages/forge/src/deploy/scope.ts`
- **evidence** `packages/forge/src/deploy/init.ts` · `packages/forge/src/deploy/scope.ts`
- **dispatchable** no ruling owed
