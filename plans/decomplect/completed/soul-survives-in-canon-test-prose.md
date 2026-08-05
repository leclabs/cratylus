# The retired sign survives in test prose, which is where it re-teaches itself

> Found 2026-08-05 by the agent landing `t-canon-soul`, which swept all 12 source sites and then
> named what it could not reach.

## The residue

`packages/canon/src` is clean. `packages/canon/test` is not — **7 files** still carry `SOUL` in
comments, `describe` strings, and local variable names, including a literal `const soul =`:

`symbol-altitude.test.ts` · `reader-density.test.ts` (×4) · `null-dimension.test.ts` (×10) ·
`cratylism.test.ts` (×2) · `projection-stability.test.ts` (×3) · `structural-parsimony.test.ts` ·
`reader-register.ts`

All pass green, and that is the problem.

## Why this is not cosmetic

`SOUL` was retired because **the sign decodes to the opposite of its referent** — `MODEL.md:70`
makes a cell the BEING and its projections the FACES, and every prior `soul` fires is the BEING.

A test file is the densest prose in the repository about what the corpus MEANS. A reader who opens
`null-dimension.test.ts` to learn what is being tested meets the retired sign ten times, in a file
that passes, and reasonably concludes it is current vocabulary. **Test prose is where a retired sign
quietly re-teaches itself** — it is not projected, so no oracle sees it; it is not source, so no
cell gate reads it; and it is green, so nothing complains.

This is the same class as the `record-retrofit` finding, inverted: there, a live sweep falsified
records. Here, records the sweep could not reach keep a falsified sign alive.

## Not a blanket sweep — two classes must be distinguished

1. **Live vocabulary** — a comment or `describe` explaining what the test checks TODAY. These are
   authored surfaces and take `Target`.
2. **Historical citation** — prose naming what a thing WAS called, e.g. a gate whose subject is the
   rename itself. These stay, and the `turn-*.txt` fixtures stay untouched for the same reason
   (a captured transcript rewritten is falsified evidence).

Sorting one from the other is the whole task; a `sed` over the seven files is the wrong instrument.

## Acceptance

- Every live-vocabulary use takes the current sign; every historical citation stays and says so.
- `const soul` and any other identifier carrying the retired root are renamed — an identifier is
  not prose and has no historical-citation defence.
- The gates that read cell text stay green, and the render oracle does not move (no test file is
  projected). Confirm rather than assume.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** skill-cells · **wave** 0
- **depends on** `t-canon-soul`
- **writes** `packages/canon/test/cratylism.test.ts` · `packages/canon/test/null-dimension.test.ts` · `packages/canon/test/projection-stability.test.ts` · `packages/canon/test/reader-density.test.ts` · `packages/canon/test/reader-register.ts` · `packages/canon/test/structural-parsimony.test.ts` · `packages/canon/test/symbol-altitude.test.ts`
- **compiles against** `packages/canon/src/genus/founding-doctrine.ts`
- **evidence** `packages/canon/test/null-dimension.test.ts` · `MODEL.md`
- **dispatchable** no ruling owed
