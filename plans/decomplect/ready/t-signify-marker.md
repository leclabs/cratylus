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

## ▶ RULING 2026-08-05 — ⊥ BY VACUITY. The marker names no referent. Delete it; replace it with a type-level witness.

`catalog/index.ts:282-284` reads `const kind: FragmentKind = meta.arity;` — an **identity
assignment, not a map**. There is no function, no table, no entity to name: `Arity` is a subtype of
`FragmentKind` and the assignment is a width coercion. σ\*(∅) is undefined, and a name for a
non-entity cannot be derived and must not be minted.

**The marker was not recording an owed derivation. It was recording an UNDECLARED SUBTYPE RELATION
that a comment was compensating for.** This shard's own acceptance already allowed this exit.

**Candidate set, recorded per the C6 protocol (2026-08-05):** ⟨`arityToKind` · `kindOfArity` ·
`structuralKind` · `valueShape` · `fragmentShape` · `widen` · `arityKind`⟩ — all ⊥, each because it
names a mapping that does not exist in the code. **Re-test only if an actual non-identity arity→kind
function appears.**

The repair converts the promissory note into a **gate**: add a compile-time witness
(`type _ArityIsFragmentKind = Arity extends FragmentKind ? true : never`) or derive `Arity` from
`FragmentKind`, so the coercion is checked rather than asserted in prose. The residual becomes real,
not an alibi.

**Follow-on filed, not built here**: a gate for the class — `[SIGNIFY:` must return 0 outside
`plans/`. Nothing currently notices a new marker.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 0
- **depends on** —
- **writes** `packages/forge/src/catalog/**`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/forge/src/catalog/index.ts`
- **dispatchable** no ruling owed
