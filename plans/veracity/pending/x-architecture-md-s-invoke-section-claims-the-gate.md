# ARCHITECTURE.md's invoke section claims the gate's coverage stops at the language boundary; bin-name-single-home.test.ts now walks .sh and .mjs, so the present-tense claim is false at HEAD

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** ARCHITECTURE.md's invoke section claims the gate's coverage stops at the language boundary; bin-name-single-home.test.ts now walks .sh and .mjs, so the present-tense claim is false at HEAD

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-08-06 from `df3aad73`, while executing `t-ground-row-truth`.

## VERDICT — VERIFIED 2026-08-06

`ARCHITECTURE.md:165` states, in present tense and bolded as a standing conclusion:
**"The gate's coverage stops at the language boundary"**. False at HEAD.

`packages/canon/test/bin-name-single-home.test.ts:167` walks `.sh` and `.mjs` explicitly, and
`:366` asserts _"EVERY hand-authored shell or .mjs source under packages/_/src derives the
bin"\*. Its own header (`:358`) argues the point: "the bin's operative sites are shell and
`.mjs`: text no compiler reads".

Note for whoever repairs it: the surrounding narration is correctly PAST tense — the
`${MEMORY_BIN:-...}` fallback genuinely _was_ invisible when it was found. Only the bolded
conclusion generalizes a fixed condition into a standing one. Repair the conclusion; do not
rewrite the history around it.
