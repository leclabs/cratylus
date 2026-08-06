# t-designator-citation-prohibition

**Wave 1.** The law that keeps `t-dead-designator-citations` repaired. Blocked on it:
landing a gate while 26 live sites violate it turns the pipeline red for correct work.

## Intent

A shard designator cited in a live source is a warrant the reader cannot follow, and it
becomes one silently — at the retirement of the plan, in a commit that touches neither the
citing file nor anything near it. `command-veracity.test.ts`'s PLAN-PATH law cannot reach
the class: there is no `plans/` token to match.

**A VERACITY gate for this class is not buildable, and knowing why is the shard.** Cratylism
makes a shard's name and the live concept's name **the same sign** — σ\*(c) is discovered,
praxis names a shard after the concept it addresses, so both get it. Measured over 413
historical shard ids: `plan-path`, `stance-guardrail`, `structural-parsimony`,
`reader-density`, `bin-name` and `memory-nudge` each name **both** a retired shard and a
live artifact in this tree, and **46.5% (192/413) are bare kebab slugs** with no property
distinguishing them from ordinary hyphenated prose. No matcher can separate "cites a dead
shard" from "names a live concept" there, and no oracle answers "is this designator live?"
once the plan is deleted — the live-`plans/` scan dies on the empty set (the class that has
now bitten five times), and git history has the wrong polarity: it says a designator once
existed, which for a dead citation is always true. A retirement manifest would work and is
exactly the hand-maintained carrier `f958d9b9` deleted a verb to avoid.

**So the law is a PROHIBITION, not a resolution.** Not "the designator must resolve" but
"a live source must not cite one, full stop" — decidable by shape alone, needing no oracle,
surviving the empty plan set trivially because it never asks the tree a question.

## Inputs

- The roster produced by `t-dead-designator-citations`: every token examined, its verdict,
  and the evidence. This is what calibrates the matcher and populates the controls.
- `packages/canon/test/command-veracity.test.ts` — `authoredLines()` (THE ONE WALK),
  `inScope`, `isTranscript`, and the reach/convict/exonerate structure both existing laws use.
- `packages/canon/test/gate-convicts.test.ts` — the meta-gate this law must satisfy.

## Constraints

- **Reuse `authoredLines()`.** Its docstring states the property: _"neither walks the tree a
  second time, so a scope ruling argued once cannot come apart between them."_ A third walk
  breaks it. Add a predicate, not a traversal.
- **Scope must widen to `**/test/**` for this law, and only this law.** `inScope` excludes
  test files by a use/mention argument that is correct for command citations; it is wrong
  here — 4 of 7 confirmed offenders and 9 of 19 original `memiso` lines live in test files.
  Widening must be argued in the header, not done quietly, and the closed-record banner
  exemption still applies.
- **The reach leg must count SIGIL-SHAPED TOKENS, not citations.** The honest steady state
  after wave 0 is zero citations, so a citation-counting reach leg reads green for having
  looked at nothing — the same argument the plan-path law already makes for itself.
- **Both fixtures.** Convicting proves it bites; **exonerating** proves it does not bite
  wrongly. The exonerating case must include a live concept name that collides with a
  retired shard id (`plan-path`, `structural-parsimony`) — that collision is the whole
  reason this law is narrow, and an unguarded matcher would convict the corpus's own names.
- **State the coverage ceiling in the header.** This law reaches the sigiled ~53.5% and
  **cannot** reach the bare-slug 46.5%. Say so, with the collision as evidence. A reader who
  takes it for whole-class coverage will stop looking for the half it cannot see.
  Coverage is not conformance.
- Known false-positive pressures, both measured: `t-hand-edit` matching inside
  `regenerate-don't-hand-edit`, and this gate's own file, which must cite a dead designator
  to test for one.

## Deps

- `t-dead-designator-citations`

## Outputs

- A third law in `packages/canon/test/command-veracity.test.ts` (or a sibling file, if the
  scope widening makes one file dishonest — argue whichever is chosen).
- Header prose carrying: why resolution is impossible here, why prohibition is the form,
  what the ceiling is, and why the scope widened.

## Accept

1. The law convicts a synthetic sigiled citation and **exonerates** a live concept name that
   collides with a retired shard id. Both directions, over the real matcher.
2. The reach leg reds if the matcher is narrowed — verified by narrowing it on purpose and
   watching it go red. Not by inspection.
3. The live corpus passes, and the pass is not vacuous: the reach leg's denominator is
   printed and non-trivial.
4. `pnpm verify` and `pnpm typecheck:test` green.
5. The header states the ceiling. A reader with zero project knowledge can tell from the
   file alone which half of the class is unguarded.

**Pre.** Fails today: no gate of any shape reaches shard-designator citations.
