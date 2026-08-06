# veracity

> The corpus's claims about itself are mechanically true, or they are deleted.

`mirror(state, R, content)` — generated view. State lives in the folder each task-file
sits in; `R` is below.

## Why this plan exists

> **Provenance — read before binding.** This plan was **minted at wake on an empty plan
> set**, because `wake` then carried an unguarded `∄ P : bound(P) ⇒ bind(elect)` and
> `orient ⊨ ∃! bound`, making a plan the only way to discharge the cell. The operator gave
> no objective — the session's sole input was a bare `/wake`. That defect is fixed at
> `c4059fba`: `electable = ∅` is now a terminal wake-state, so no successor plan can be
> minted this way. **The findings below are real and wave 0's work is landed and pushed.
> What was never affirmed is the plan's warrant.** It remains `bound`, so the next wake
> will bind it and dispatch wave 1. If that is not wanted, `unbind` under
> `operator-redirect` and retire it — do not let inheritance stand in for a decision.

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
concurrency precondition holds; the wave needs no isolation. **Landed** at `de8ba968`
(ground-row truth) and `df3aad73` (119 designators), recorded at `895833ce`.

`wave(1) = { t-designator-citation-prohibition }` — was promoted to `ready` by wave 0's
completion, then **moved back to `pending` on 2026-08-06: its central thesis is REFUTED and a
ruling is owed.** `ready` promises an executor can pick a shard up and finish; this one would
have built the wrong instrument. Never dispatched.

## R

| task                                | depends on                    | why                                                                                                                                      |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `t-designator-citation-prohibition` | `t-dead-designator-citations` | a gate landing while 26 live sites violate it reds the pipeline for correct work; and its controls are calibrated by that shard's roster |

## Shards

| state     | task                                | concern                                                                      |
| --------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| completed | `t-dead-designator-citations`       | repair every live source citing a retired plan's shard designator            |
| completed | `t-ground-row-truth`                | `ARCHITECTURE.md`'s divergence table stops asserting what is not so          |
| pending   | `t-designator-citation-prohibition` | **THESIS REFUTED — ruling owed.** the gate it calls unbuildable is buildable |

### Every shard re-tested as a hypothesis — 2026-08-06

Each shard asserts a defect exists. That is falsifiable, and this plan had already shipped two
filings that were false, so all seven were re-derived against the tree rather than trusted.
Verdicts are recorded in each shard file.

**5 of 7 name a real defect. Nearly every NUMBER attached to them is wrong.**

| claimed                              | actual                                        |
| ------------------------------------ | --------------------------------------------- |
| 413 historical shard ids             | **439** (irreproducible under 12 definitions) |
| 192/413 bare kebab slugs             | **204/439** — the 46.5% ratio is exact        |
| 6 names collide shard-sign ⇄ concept | **0 of 6 is a shard id** (all stem prefixes)  |
| 26 live violating sites              | **14** at HEAD                                |
| prohibition reaches 53.5%            | **36.7%**; unreachable is 63.3%, not 46.5%    |
| 31 sources cite a dead document      | **26**, and 24 are one document               |

The defects were found by READING; the numbers were asserted alongside them without being
computed. That is the same failure mode as the handoff record that opened this plan
(_"verify GREEN, 718 tests"_ while the pipeline was red), and it is why the wave-1 shard
reached "unbuildable" and stopped — it never tested the oracle the corpus already ships
(`plan-set.ts:287`, `derived-on-demand-never-stored`).

Two dead designators that survived wave 0 are repaired ahead of this note:
`forge/src/project/runtime-shim.ts:55` (inside the projected shim body, so it shipped into
every deployed artifact) and `forge/tsup.config.ts:8`.

### Filed beside the path (stubs — symptom only, no census, no acceptance)

Both surfaced while executing wave 0 and were filed rather than chased, per
`¬ impedes(d, t) ⇒ file(owns(d), d)`. Whoever promotes either to `ready` owes it a spec.

| state   | task                                                 | symptom                                                                                                                                              |
| ------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| pending | `x-31-live-sources-cite-a-dead-document-plus-sectio` | 31 live sources cite a dead DOCUMENT + section (`NORTH-STAR §2`, `DESIGN.md §7`) — a shape neither existing law can see                              |
| pending | `x-architecture-md-s-invoke-section-claims-the-gate` | `ARCHITECTURE.md`'s invoke section claims coverage stops at the language boundary; the gate now walks `.sh` and `.mjs`                               |
| pending | `x-nothing-gates-deployed-artifact-freshness-no-che` | nothing compares the projection ON THE HOST against the corpus, so an agent can run a superseded projection of its own governing cell with no signal |
| pending | `x-a-second-deploy-manifest-under-the-retired-brand` | a second deploy manifest under the retired brand claims the same target paths as `.forge/` — two records, one target tree                            |

> **This plan GROWS as it executes.** `¬ impedes(d, t) ⇒ file(owns(d), d)` routes every defect
> found beside the path into a new pending shard of the SAME plan: 3 shards at minting, 7 here.
> And `file` writes with `¬ census ∧ ¬ re-slice`, so each stub has no edge in `R` and no
> `promote` can reach it — `done(P)` is therefore unreachable while any filing stands (the
> third disjunct of praxis's frontier law, added at `f06c9283`). A plan nobody affirmed is
> now self-extending. Retire it or promote the filings deliberately; do not simply inherit it.

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
