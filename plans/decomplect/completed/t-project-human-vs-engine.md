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

## ▶ RULING 2026-08-05 — DELETE the code, and revise ENGINE in the same commit

Not to a silent excision — to `boundary-projection ≜ {deploy}` **plus a dated residual**.

The extension is not merely unused, it is **empty and cannot be refilled**: the operator's ruling of
zero generated documentation killed the only artifact class this corpus projects to a human reader,
and the hand-authored ground is explicitly _"never generated from source"_, so it is not a
`project-human(c)` output and `source(h)` is undefined for it. **A set member with a provably empty
extension is a claim ENGINE cannot support.**

**This is not the operator's call and it is not escalated.** Their standing ruling already
determined the extension; revising ENGINE is the mechanical consequence, reversible, in-domain.
What _would_ be theirs is reopening _should this system generate human documentation at all_ — and
nobody is asking that.

**Bare deletion is the wrong form.** This census's most portable lesson is that a negative result
decays exactly like a positive one and leaves no artifact to convict. `boundary-projection ≜
{deploy}` with nothing else re-mints `project-human` in six months. So ENGINE carries a one-line
residual: `project-human` is **defined and UNINHABITED in this corpus** — operator ruling
2026-08-05, zero generated documentation — and the refusal travels with its date and its reason.

Also dies: the private duplicate `dimensionTitle` (`project-human.ts:29`), leaving
`core/anatomy-body.ts:17` the single home. `gate-convicts.test.ts` turns red if its row is not
removed with the file — that is the only gate, and **the oracle does not move** (zero callers).

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** projection-and-ground · **wave** 0
- **depends on** `t-soul-to-target-in-forge`
- **writes** `packages/forge/src/project/project-human.ts` · `ENGINE.md`
- **compiles against** `packages/forge/src/core/anatomy-body.ts`
- **evidence** `packages/forge/src/project/project-human.ts` · `ENGINE.md`
- **dispatchable** no ruling owed
