# t-invoke-coverage-claim

**Wave 0.** One false sentence in `ARCHITECTURE.md`. Output is that file alone.

## Intent

`ARCHITECTURE.md:165` asserts, in the present tense and bolded as a standing conclusion:

> **"The gate's coverage stops at the language boundary"**

False at HEAD. `packages/canon/test/bin-name-single-home.test.ts:167` walks `.sh` and `.mjs`
explicitly, and `:366` asserts _"EVERY hand-authored shell or .mjs source under
`packages/_/src`derives the bin"*. Its own header at`:358`argues the point: *"the bin's
operative sites are shell and`.mjs`: text no compiler reads."\*

**The surrounding narration is correct and must survive.** The `${MEMORY_BIN:-…}` fallback
genuinely WAS invisible when it was found — that is history, in the past tense, and true.
The defect is one clause generalising a fixed condition into a standing property. This is the
same shape as the divergence row `t-ground-row-truth` struck: a repaired condition still
being reported as live.

## Inputs

- `ARCHITECTURE.md:160-166`
- `packages/canon/test/bin-name-single-home.test.ts` — `:167` (the `.sh`/`.mjs` walk),
  `:358` (the header's argument), `:366` (the assertion)
- `de8ba968` — the precedent: strike, mark repaired, name the gate that now holds it.

## Constraints

- **Repair the conclusion; do not rewrite the history around it.** Past-tense narration of a
  real past failure is not a defect.
- Name the gate that now holds the property, so the sentence becomes checkable rather than
  merely corrected.

## Deps

(none — wave 0)

## Outputs

- `ARCHITECTURE.md`

## Accept

1. `grep -n "coverage stops at the language boundary" ARCHITECTURE.md` returns **0** in any
   present-tense assertion.
2. The replacement names `bin-name-single-home.test.ts` and the extensions it walks, so a
   future reader can falsify it in one command.
3. The past-tense account of the `${MEMORY_BIN:-…}` discovery is still present.
4. `pnpm verify` green.
