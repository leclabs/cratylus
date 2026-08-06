# dangling-reference

> A reference that resolves for its author and for nobody else is a defect, whether the
> referent was deleted, never tracked, or lives on one host.

`mirror(state, R, content)` — generated view. State lives in the folder each task-file sits
in; `R` is below.

## Why this plan exists

Supersedes `veracity`, whose subject was right and whose measurements were not. Every shard
here survived being re-tested as a hypothesis against the tree; the ones that did not are
recorded as withdrawn below rather than carried forward silently.

**The concept, discovered rather than coined.** `veracity` framed its subject as "a claim
riding a path nothing checks", which is the SYMPTOM. The property the surviving defects
actually share is narrower and it names the repair: a citation whose **referent is out of the
reader's reach**. Four ways a referent leaves reach, one per class here:

| the referent…             | example                                   | why no existing check sees it                           |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| was **deleted**           | a retired plan's shard designator         | no `plans/` token to match, no residence to test        |
| is **untracked**          | `NORTH-STAR §2` in `.scratchpad/`         | `existsSync` on the authoring host says LIVE            |
| **moved under the claim** | `ARCHITECTURE.md`'s invoke-coverage row   | the sentence is prose; the gate that refutes it is code |
| lives **on the host**     | a superseded projection, a stale manifest | the repo cannot see what a host is running              |

The repair is the same shape every time: **give the checker the missing reach, or withdraw the
claim.** Never re-point a citation at something that will dangle again.

## Waves

`wave(0) = { t-src-dangling-references, t-test-dangling-references, t-invoke-coverage-claim, t-drift-notice-timing }`
Outputs are disjoint by LOCATION, not by defect class — `packages/{forge,memory}/src` ·
`packages/*/test` · `ARCHITECTURE.md` · `packages/canon/src/hooks`. Cutting by class was
tried and rejected: dead-document and dead-designator citations both occur in
`packages/forge/test`, so a class-cut wave would contend. The concurrency precondition holds;
the wave needs no isolation.

`wave(1) = { t-retirement-oracle }` — blocked on both repair shards, because a gate landing
while violations stand reds the pipeline for correct work.

Not in a wave: `x-second-deploy-manifest` — **ruling owed**, an irreversible host-side act
reserved to the operator, filed with a recommendation.

## R

| task                  | depends on                                                | why                                                                                                                                                  |
| --------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `t-retirement-oracle` | `t-src-dangling-references`, `t-test-dangling-references` | 13 live violations stand at HEAD; a gate landing first reds correct work, and its exoneration fixture is calibrated by what the repairs leave behind |

## Shards

| state   | task                         | concern                                                                         |
| ------- | ---------------------------- | ------------------------------------------------------------------------------- |
| ready   | `t-src-dangling-references`  | 26 dead-document citations in `forge`/`memory` source, 24 of them one doc       |
| ready   | `t-test-dangling-references` | 13 dead-designator citations `df3aad73` left behind, all under `test/`          |
| ready   | `t-invoke-coverage-claim`    | one present-tense sentence in `ARCHITECTURE.md` that the gate already refutes   |
| ready   | `t-drift-notice-timing`      | the drift comparator is correct, advisory-only, and fires only at session start |
| pending | `t-retirement-oracle`        | the designator gate `veracity` called unbuildable — it is buildable             |
| pending | `x-second-deploy-manifest`   | **ruling owed** — two records, one target tree, 40/40 shadowed                  |

## What was withdrawn from `veracity`, and why

Recorded here because a filing deleted without its refutation comes back.

- **"Nothing gates deployed-artifact freshness."** FALSE. `deploy-drift-notice` exists, is
  deployed, is wired to `SessionStart`, and works — it caught a rendered-but-undeployed
  `praxis` cell and printed the exact superseded line the session was running under. What
  survives is the narrower `t-drift-notice-timing`.
- **"A veracity gate for shard designators is not buildable."** FALSE, and its own evidence
  refutes it: the six names offered as proof that shard-sign and concept-sign collide are
  **stem prefixes of longer qualified ids — none is a shard id**, and 0 of 439 retired ids
  equals a live file stem. Reborn, corrected, as `t-retirement-oracle`.
- **"Nothing gates citations into plans retired before the last one."** Already withdrawn by
  `veracity` itself: `existsSync` has no recency parameter and the gate had a green test
  convicting a citation into a long-retired plan.

## The lesson this plan is built to not repeat

`veracity`'s defects were found by READING and were mostly real. Its NUMBERS were asserted
alongside them without being computed, and then quoted forward as evidence:

| claimed                              | actual                                        |
| ------------------------------------ | --------------------------------------------- |
| 413 historical shard ids             | **439** — irreproducible under 12 definitions |
| 192/413 bare kebab slugs             | **204/439** — the 46.5% ratio is exact        |
| 6 names collide shard-sign ⇄ concept | **0 of 6 is a shard id**                      |
| 26 live violating sites              | **14** at HEAD                                |
| prohibition reaches 53.5%            | **36.7%**; unreachable is 63.3%, not 46.5%    |
| 31 sources cite a dead document      | **26**, and 24 are one document               |

An exact ratio with both absolutes wrong is the signature of a measurement that was computed
once, then remembered. **Every shard here therefore carries a re-census constraint**, and
every reach leg owes a printed denominator — because "found nothing" and "could not look"
are otherwise the same output.
