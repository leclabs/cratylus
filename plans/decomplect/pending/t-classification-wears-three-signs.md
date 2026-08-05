# One concept, three signs, across the type, the field, and a shipped cell

> Found 2026-08-05 during the `curated` ruling. Filed rather than folded, because it is a different
> defect from the one that ruling repairs.

## The three

- `Classification` — the type (`schema/src/index.ts:74`)
- `kind` — the field that holds it (`schema/src/index.ts:267`, `forge/src/catalog/index.ts:49`)
- `openness` — the same concept in a **shipped cell** (`create-agent` SKILL.md:18)

A reader meets the concept under a different name in the projector, the catalog, and the agent-facing
skill. The third is the expensive one: it is the only surface a non-author reads.

## Adjacent, and NOT evidence for a merge

`create-agent` SKILL.md:20 reads `open, coined ≜ an extensible value-set` — lumping the two on
**extensibility**, a different axis from the type's declared one (_how the catalog is sourced_). That
line is imprecise and must be repaired, but it argued for a merge that the `curated` ruling refused
on measurement.

## Acceptance

- One sign for the concept, carried by the type, the field, and the cell alike.
- The cell's `extensible` gloss is corrected to the sourcing axis, or removed.
- Render oracle moves (a shipped cell); re-baseline deliberately.
- Interacts with `t-kind-is-triple-booked` — **the field rename is the same edit**. Sequence together.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** skill-cells · **wave** 1
- **depends on** `t-coined-classification` · `t-authoring-surface`
- **writes** `packages/canon/src/skills/create-agent/**`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/schema/src/index.ts` · `packages/canon/src/skills/create-agent/skill.ts`
- **dispatchable** no ruling owed
