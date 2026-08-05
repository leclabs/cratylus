# The parsimony gate is canon's, and its only reader already says so

> Found 2026-08-05 while routing four doctrine constants through the `Policy` seam. Three went
> through. This one was REFUSED, and the refusal is the finding.

## Why injection is the wrong answer here

The other three constants were data the projector had baked in. This one is not: **the coupling is
in the WITNESSES, not the constants.**

- `genusFloor` quantifies over `corpus.agents` — canon's `agents/`
- `resolvedDup` hardcodes `/Resolved$/` and the literal type name `ResolvedAgent`
- `absorbedIdentity` reads `carriesMark` — canon's `mark:{emoji,hue}` identity token

Injecting `DIMENSION_IMPORT` and `MARK_FIELD` and the three class labels would relocate the regexes
and leave three functions whose **logic still encodes canon's tree**. That is a seam that _looks_
satisfied while the fusion hides behind it — **strictly worse than the honest status quo**, because
it converts a visible defect into an invisible one and spends the seam's credibility doing it.

## The decisive evidence

The module has **exactly one consumer**, `canon/test/structural-parsimony.test.ts`, and zero in
forge. That consumer's own header (line 6) cites the predicate as
`src/toolkit/cold-oracle/structural-parsimony.ts` — **a canon path that does not exist**, while its
import reaches `@cratylus/forge/validate`.

The module's only reader already documents it as canon's own. It was written in the wrong package
and the comment records where the author thought it lived.

## Not deletion

It is a live regression-prevention gate with two-sided non-vacuity controls, classified `GATE` in the
meta-gate registry. The property is real; only its address is wrong.

## Acceptance

- The module moves to `packages/canon/src/toolkit/`, its consumer's stale header citation becomes
  true, and `forge/src/validate/` no longer exports it.
- ARCHITECTURE's property 2 is served, not strained: nothing in canon should depend on the projector
  for a gate over canon's own corpus.
- The meta-gate REGISTRY row follows the file.
- **This changes a package boundary, so it is not a seam-threading task** — that is why it was
  refused under the seam shard rather than smuggled in.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** corpus-rename · **wave** 0
- **depends on** `t-policy-seam-unused`
- **writes** `packages/forge/src/validate/structural-parsimony.ts` · `packages/canon/src/toolkit/structural-parsimony.ts` · `packages/canon/test/structural-parsimony.test.ts` · `packages/canon/test/gate-convicts.test.ts`
- **compiles against** `packages/canon/src/manifest.ts`
- **evidence** `packages/forge/src/validate/structural-parsimony.ts` · `packages/canon/test/structural-parsimony.test.ts`
- **dispatchable** no ruling owed
