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

## Acceptance

- The ruling is recorded in ground or in the cell — **not in this file**, which is a work order and
  will be retired.
- Whichever repair lands, `packages/canon/src/skills/create-agent/skill.ts:20` states only things
  true of the tree: no field the shape does not have, and no `∉ catalog` claim contradicted by
  `anatomy.ts`.
- **The control fails today**: a check asserting the line's claims against `schema/src/index.ts`'s
  `Agent` and against the `model` catalog convicts the current text on all three counts. Write that
  check first and watch it go red, or the repair is unverifiable.
- If the answer is "add `substrate` to `Agent`": **STOP and report.** That is a schema change with
  10 agent vectors downstream, not a line edit.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** signification · **wave** 1
- **depends on** `t-manifest-file-basename`
- **writes** `packages/canon/src/skills/create-agent/**`
- **compiles against** `packages/canon/src/dimensions/model/claude.ts`
- **evidence** `packages/canon/src/skills/create-agent/skill.ts` · `packages/schema/src/index.ts`
- **RULING OWED — not dispatchable** whether an instance-bound substrate concept exists distinct from the `model` dimension, and where it lives
