# One line names a field the shape does not have and denies a membership that exists

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution** —
> the target of a move is indeterminate until it is made.

## The line

`canon/src/skills/create-agent/skill.ts:20`:

```
instance-bound ≜ provenance⟨lineage-mark⟩ ∧ substrate⟨model/runtime⟩ ⟨auto-set · fresh mark · substrate ↦ claude · ∉ catalog⟩
```

## It is false against the tree in three independent ways

1. **`substrate` is not an agent field.** `schema/src/index.ts:440-459` — `Agent` has `name`,
   `description`, `preamble?`, `archetype`, `provenance`. No `substrate`. The word exists only on
   `HookCell`, where it means `'harness' | 'git'` — **a different concept wearing the same sign.**
2. **`∉ catalog` is contradicted by A7's own file.** The gloss `substrate⟨model/runtime⟩` names the
   `model` dimension, which **is** in the manifest (`anatomy.ts:84`) with `claude` in its catalog.
3. **"auto-set" is contradicted by practice** — all 10 agents set `model: null`.

## The ruling owed

_Does the corpus have an instance-bound substrate concept distinct from the `model` dimension, and if
so what is its home?_ Three incompatible repairs — delete the clause; read it as `model` and drop
`∉ catalog`; add `substrate` to `Agent` — and a mechanical edit cannot choose.

## Blast radius

1 line, 1 file, **0 gates**. That is why it survived: no property convicts it.
