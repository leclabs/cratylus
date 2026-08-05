# One concept, two signs, same package, same directory — and a test exists only to bridge them

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

## The collision

`schema/src/rule-cell.ts:22` — _"σ\*-signified canonical identity — the accept()/REFLEXIVE target"_ →
field named **`definiens`**.
`schema/src/hook-cell.ts:74` — _"σ\*-signified canonical identity (body = ⟨α, residue⟩) — the accept()
target"_ → field named **`residue`**.

Same gloss. Sibling files. And `canon/test/hook-rule-boundary.test.ts:190,229` writes
`definiens: c.residue` — **an adapter whose entire purpose is bridging two names for one field.**

## The direction is determined; the sweep is NOT

`residue` is MODEL's (`MODEL.md:50` `body(c) = ⟨α(c), residue(c)⟩`). `definiens` is not in MODEL. So
the direction is settled.

**But `definiens` is also a live ρ-class name for a DIFFERENT referent** — the post-`≜` text of a
dimension value — at `reader-density.test.ts:247` (`'dimension-definiens'`), `:137`, `:272-280`,
`:361`, `:376`, `:434-438`, plus `create-agent/skill.ts:15` and `symbol-probe-gate.ts:113`.

| sweep                               | sites                |
| ----------------------------------- | -------------------- |
| the field rename (correct)          | ~12 sites / ~6 files |
| naive `definiens` sweep (**wrong**) | 88 sites / 23 files  |

**The disambiguation is the decision.** A bulk rename here destroys a correct sign.

## Acceptance

- The field has one name; the ρ-class keeps its own, and a note records that they were never the
  same concept.
- The bridging adapter in `hook-rule-boundary.test.ts` is deleted, not updated.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 1
- **depends on** `t-worker-payload-seam-and-property-1`
- **writes** `packages/schema/src/rule-cell.ts` · `packages/canon/test/hook-rule-boundary.test.ts`
- **compiles against** `packages/schema/src/hook-cell.ts`
- **evidence** `packages/schema/src/rule-cell.ts` · `packages/schema/src/hook-cell.ts` · `MODEL.md`
- **dispatchable** no ruling owed
