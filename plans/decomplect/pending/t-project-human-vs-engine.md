# Dead code that ground still declares the engine owns

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution** —
> the target of a move is indeterminate until it is made.

## The state

`forge/src/project/project-human.ts` — `projectHumanDimension` has **0 callers**, and is **not
exported** from `project/index.ts`, so it is unreachable through forge's `exports` map. Not public
API. Dead. The artifact class it generates is gone too: `find packages -path '*/dimensions/*' -name
README.md` → **0**. Canon's half was deleted in `e3223125`, which explicitly left forge's copy as
_"an orphaned primitive to decide on separately."_ This is that decision.

## Why the deletion is BLOCKED

`ENGINE.md:40-41` declares, as GROUND:

```
project-human       : cell → human-artifact ; project-human(c) = ⟨ σ*_human(k) : k ∈ concepts(c) ⟩
boundary-projection ≜ {deploy, project-human}
```

and `:44` asserts ENGINE owns `boundary-projection`. **Deleting the sole implementation leaves
ground declaring an operation the engine does not realize.**

The operator ruling that made the artifact class dead ("zero documentation is to be generated") was
made against the **artifact class**, not against `boundary-projection`'s membership. Those are
different questions and the sweep did not record the second one.

## Acceptance

- Either `ENGINE.md` is revised in the same act — `boundary-projection ≜ {deploy}` — or the
  deletion is refused and the primitive gets a caller.
- Blast radius if deleted: 3 files (`project-human.ts`, its test, `gate-convicts.test.ts:114`), plus
  a duplicate `dimensionTitle` (`core/anatomy-body.ts:17` exported vs `project-human.ts:29` private)
  that dies with it.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** forge-seams · **wave** 1
- **depends on** `t-soul-to-target-in-forge`
- **writes** `packages/forge/src/project/project-human.ts` · `ENGINE.md`
- **compiles against** `packages/forge/src/core/anatomy-body.ts`
- **evidence** `packages/forge/src/project/project-human.ts` · `ENGINE.md`
- **RULING OWED — not dispatchable** ENGINE.md declares project-human a member of boundary-projection; deleting the sole implementation leaves ground declaring an unrealized operation
