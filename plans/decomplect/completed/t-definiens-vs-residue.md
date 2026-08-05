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

## ▶ RULING 2026-08-05 — `RuleCell.definiens` → **`RuleCell.residue`**. `definiens` is RESERVED, and ~115 sites stay.

**The disambiguation is DISCOVERED IN MODEL, not coined.** `MODEL.md:50`:

```
PARSIMONIOUS: ∀c∈Corpus: body(c)=⟨α(c),residue(c)⟩ ∧ residue(c)=D(c)∖fired(α(c))
```

**`D` and `residue` are DIFFERENT OBJECTS**, related by one subtraction:

| sign        | referent          | side of `∖ fired(α)`                        |
| ----------- | ----------------- | ------------------------------------------- |
| `definiens` | `D(c)`            | the raw post-`≜` text, **before** the cut   |
| `residue`   | `D(c) ∖ fired(α)` | a payload that has **already paid** the cut |

**The rule, stated in `schema/src/rule-cell.ts`:** a field is `residue` **iff PARSIMONIOUS
quantifies over it**; `definiens` **iff it is the un-adjudicated input a split produced**. Both
signs are live and correct — they name opposite sides of one subtraction.

**`AcceptCell.definiens` in forge is CORRECT and STAYS — the shard's acceptance is OVERRULED on
that point.** It is the witness INPUT: the `D` that `parsimonious()` reads _in order to decide_ what
`fired(α)` covers. Renaming it would put MODEL's post-subtraction sign on the pre-subtraction input
and leave that leg reading as a check that a residue is a residue. Recorded here so the refusal is
not re-litigated as an oversight.

**The ρ-class `dimension-definiens` was NOT swept** — post-`≜` text produced by `splitBody`, raw by
construction. `reader-density.test.ts` still asserts `count('dimension-definiens') > 100`.

**The bridge does not die; the ASYMMETRY does.** After the rename both loops read
`definiens: c.residue`, so they collapse into one roster (`sourceCells`) — and what survives is not
two names for one field, it is the honest lift `residue → D`, the strictest reading available
(the leg must find nothing left to subtract).

**THE REAL DELIVERABLE IS THE GATE.** The collision was found by a human reading two sibling files;
nothing in the tree could see it, and the next one would be unconvictable the same way.
`canon/test/cell-gloss-census.test.ts` censuses every `*Cell` interface in `@cratylus/schema` for
⟨sign, gloss⟩ and asserts (a) the map gloss → sign is a **function**, (b) the σ\*-identity gloss is
borne by `residue` on **every** cell shape, exactly once. Keyed on the GLOSS, never the field name:
two names is the defect, not the signal.

## Acceptance

- The field has one name; the ρ-class keeps its own, and a note records that they were never the
  same concept.
- The bridging adapter in `hook-rule-boundary.test.ts` is deleted, not updated.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 0
- **depends on** `t-worker-payload-seam-and-property-1`
- **writes** `packages/schema/src/rule-cell.ts` · `packages/canon/test/hook-rule-boundary.test.ts`
- **compiles against** `packages/schema/src/hook-cell.ts`
- **evidence** `packages/schema/src/rule-cell.ts` · `packages/schema/src/hook-cell.ts` · `MODEL.md`
- **dispatchable** no ruling owed
