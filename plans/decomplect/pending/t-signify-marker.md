# One `[SIGNIFY: …]` marker still ships — an owed cold-decode wearing a TODO

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

## The state

`git grep -n 'SIGNIFY:'` → **exactly one hit**:

`forge/src/catalog/index.ts:283` — `// value-type a minted string-fragment node carries. [SIGNIFY: arity→kind map.]`

The other site the sweep cited (`:167`) is **gone** — half discharged, and both filed line numbers
were stale.

## Why it matters more than one comment

A `[SIGNIFY: …]` marker is a **promissory note against the corpus's own first principle**: it records
that a name was placed provisionally and never derived. One is easy to discharge; the class is what
matters, and there is currently nothing that would notice a new one being added.

## Acceptance

- The `arity→kind map` concept gets a derived anchor, or the marker is removed with the reason it was
  unnecessary.
- **A gate for the class is filed as a follow-on**, not built here: markers are cheap to add and
  invisible once the author moves on. That is the same shape as every other finding in this census.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** forge-seams · **wave** 0
- **depends on** —
- **writes** `packages/forge/src/catalog/**`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/forge/src/catalog/index.ts`
- **RULING OWED — not dispatchable** an owed cold-decode for the arity→kind map concept
