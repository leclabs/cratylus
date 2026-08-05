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

## ▶ RULING 2026-08-05 — three signs collapse to ONE: `Repertoire` · `repertoire` · `repertoire`. `openness` dies.

Executed as one edit with `t-kind-is-triple-booked`, which the shard called for. The
field rename off `kind` and the cell rename off `openness` are the same move: the concept
now wears ONE sign everywhere it appears — the projector (`DimensionMeta.repertoire`),
the catalog (`CatalogEntry.repertoire`), the manifest instance (all 22 entries), and the
shipped cell.

**`openness` was CONVICTED by blind reverse decode, not by preference.** Given only
`openness : O → { enum, open, curated }`, a cold reader reported: the `-ness` suffix
names a **scalar property**, so it predicts `Bool` or an ordinal scale (`closed < semi <
open`) — one axis, polar, before the codomain is even read. Then the fixed point: with
`open` as one of its own three members, `openness(o) = open` carries **zero differential
information**, and the reader cannot tell whether `open` is the positive pole of the
predicate the sign promised (making `enum` and `curated` two flavours of not-open) or one
peer of three. The name biases toward a 1-vs-rest grouping, which is the wrong grouping —
under it `curated` reads as a sub-case of `open`, and the set stops being disjoint.
**No member may ever be the lexeme of its own dimension.**

**The `extensible` gloss the shard names was ALREADY DISCHARGED** by
`t-coined-classification`, and is now carried further: the cell reads
`⟨who owns the value-set⟩` with per-member owner glosses (`latent` = the MODEL owns, read
out and not authored · `open` = the AGENT owns · `curated` = the CORPUS assembled).

**Why the sign is `Repertoire`** — full derivation, the `enum` → `latent` member repair
that unblocked it, and the dated rejection tables are in `t-kind-is-triple-booked`'s
ruling. The first pass here recorded `classification` with the mint escalated; that was
wrong on its own terms and is superseded there rather than quietly overwritten.

**A FALSE LAW was fixed, not filed.** The cell asserted
`openness(o) = enum ⇒ | value(o) | = 1`, which is false against the live manifest —
`autonomy` and `actions` are `latent` with `arity: 'set'`. It was an ARITY law wearing the
sourcing function's name, and the rename would have carried the falsehood forward under a
better sign. It now reads `arity(o) = scalar ⇒ | value(o) | = 1`, which pairs with the
existing `arity(o) = set ⇒ value(o) ⊆ catalog(o)`.

**Renders that move** (shipped cell — re-baseline deliberately):
`packages/canon/.render-ts/skills/create-agent/SKILL.md` and
`packages/canon/.render-ts-codex/skills/create-agent/SKILL.md`. Both move on the
front-matter `description` (the "closed enums" phrase, now stale prose for a member that
no longer exists) and on five declaration-block lines: the `repertoire` function, its
three member glosses, and the arity law. No other rendered file changes.

## Acceptance

- One sign for the concept, carried by the type, the field, and the cell alike.
- The cell's `extensible` gloss is corrected to the sourcing axis, or removed.
- Render oracle moves (a shipped cell); re-baseline deliberately.
- Interacts with `t-kind-is-triple-booked` — **the field rename is the same edit**. Sequence together.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** skill-cells · **wave** 0
- **depends on** `t-coined-classification` · `t-authoring-surface`
- **writes** `packages/canon/src/skills/create-agent/**`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/schema/src/index.ts` · `packages/canon/src/skills/create-agent/skill.ts`
- **dispatchable** no ruling owed
