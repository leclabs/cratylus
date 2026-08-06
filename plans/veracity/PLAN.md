# veracity

> The corpus's claims about itself are mechanically true, or they are deleted.

`mirror(state, R, content)` — generated view. State lives in the folder each task-file
sits in; `R` is below.

## Why this plan exists

Three findings at wake on 2026-08-06, all one class: **a claim riding a path nothing
checks.**

The session that preceded this one ended with a handoff record stating _"pnpm verify +
typecheck:test GREEN, 718 tests"_ and filing two defects. At wake: the pipeline was **red**,
and **both filings were misdescribed**.

- The red was `command-veracity.test.ts` asserting `existsSync(plans/)` — the fifth
  instance in this corpus of a check whose subject is the live tree dying when the tree
  empties, and the second in that same file, three lines above a header that had already
  written the lesson down for its sibling. Repaired at `5c8ccecc`, ahead of this plan,
  because it impeded everything.
- Filing (2), _"nothing gates citations into plans retired before the last one,"_ is
  **false and was never real**: resolution is `existsSync`, which has no recency parameter,
  and the gate has a green test convicting a citation into `plans/discipline-anchor`,
  retired many retirements back. It was a stub describing the pre-gate world, never retired
  when the gate landed. It is discharged by being **withdrawn**, and this paragraph is the
  withdrawal.
- Filing (1), the dead-designator class, is **real and ~2× the filed size** — and the fix
  it implies is not buildable in the shape it was filed. See
  `t-designator-citation-prohibition`.

Plus a fourth, found while orienting: `ARCHITECTURE.md` reports a repaired, gated condition
as a live divergence, beneath a paragraph claiming every such row is mechanically held.

## Waves

`wave(0) = { t-dead-designator-citations, t-ground-row-truth }` — disjoint outputs
(`packages/*/src` + READMEs vs. `ARCHITECTURE.md`), neither referencing the other's. The
concurrency precondition holds; the wave needs no isolation.

`wave(1) = { t-designator-citation-prohibition }`

## R

| task                                | depends on                    | why                                                                                                                                      |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `t-designator-citation-prohibition` | `t-dead-designator-citations` | a gate landing while 26 live sites violate it reds the pipeline for correct work; and its controls are calibrated by that shard's roster |

## Shards

| state   | task                                | concern                                                              |
| ------- | ----------------------------------- | -------------------------------------------------------------------- |
| ready   | `t-dead-designator-citations`       | repair every live source citing a retired plan's shard designator    |
| ready   | `t-ground-row-truth`                | `ARCHITECTURE.md`'s divergence table stops asserting what is not so  |
| pending | `t-designator-citation-prohibition` | the law that keeps the repair repaired — prohibition, not resolution |

## The finding that shapes the whole plan

A **veracity** gate for shard designators cannot be built, and the reason is the first
principle. Cratylism says σ\*(c) is discovered rather than coined; praxis names a shard
after the concept it addresses; so the shard file and the live identifier for that concept
receive **the same sign**. Measured: `plan-path`, `stance-guardrail`, `structural-parsimony`,
`reader-density`, `bin-name`, `memory-nudge` each name both a retired shard and a live
artifact here, and 192 of 413 historical shard ids are bare kebab slugs with no shape at all.

So the third shard is a **prohibition on the sigiled subset** — decidable by shape, needing
no oracle, immune to the empty-plan-set failure that has now bitten five times — with its
ceiling stated in its own header, because it can only reach half the class.
