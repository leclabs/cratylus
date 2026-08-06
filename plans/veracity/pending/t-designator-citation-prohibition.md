# t-designator-citation-prohibition

> ## THESIS REFUTED — 2026-08-06. RULING OWED. Do not execute as written.
>
> Moved `ready` → `pending`: `state(t) = ready` promises an executor can pick it up and
> FINISH, and a decision now stands between this shard and its acceptance.
>
> **The gate this shard declares unbuildable is buildable, and needs no sigil.** The
> retirement oracle is a set difference, hand-maintained by nobody:
>
> ```
> dead(D) ⇔ D ∈ basenames(*.md ever under plans/**/{pending,ready,active,completed}/, from git)
>         ∧ D ∉ basenames(present in the worktree)
> ```
>
> 439 retired ids, **26 ms**, zero stored state — the same `derived-on-demand-never-stored`
> discipline `packages/canon/src/toolkit/plan-set.ts:287` already ships for `retirement(P)`,
> and which `f958d9b9` ruled FOR when it deleted the hand-written `.landed` carrier. This
> shard cites `f958d9b9` as the reason to avoid a manifest, then treats manifest-rejection as
> oracle-nonexistence. Those are different claims.
>
> **The cratylism premise is refuted by this shard's own evidence.** Cratylism gives shard and
> concept the same _stem_, not the same _sign_: praxis qualifies an id with the work
> (`plan-path` → `plan-path-veracity`, `stance-guardrail` → `stance-guardrail-jurisdiction`).
> **0 of 439 retired ids equals a live file stem.** The six names offered below as proof of
> collision are stem prefixes of longer qualified ids — none is a shard id. Exact-id matching
> on word boundaries over 558 live files yields **9 hits: 2 true positives, 3 fixture
> mentions, 4 genuine collisions** (`cold-decode`, `explicit-omit-to-inherit`, `extend-reach`,
> `root-cause`) — 0.91%, discharged by the four-name exoneration list this shard already
> budgets for.
>
> **"Git has the wrong polarity" is this shard's polarity error.** The gate does not ask _did
> D ever exist_ — it asks _is D live_, a two-source conjunction: git supplies the historical
> leg, the worktree the live leg, dead is the difference. The same correction inverts the
> empty-plan-set objection: on `plans/ = ∅` every historical id reads dead, which is the
> CORRECT answer. The reach denominator comes from history, which is never empty — making the
> git oracle _more_ empty-set-immune than the prohibition, not less.
>
> **Every measurement below is wrong.** 413 ids → **439** (irreproducible under 12 tested
> definitions). 192/413 → **204/439** (the 46.5% ratio is exact; both absolutes are wrong).
> Reach "sigiled ~53.5%" → **36.7%**; the class is a five-way partition and the complement of
> "bare" was read as "sigiled" — 74 ids (16.9%) are reachable by neither leg, so unreachable
> is **63.3%**, not 46.5%. The `26 live sites` blocker → **14 at HEAD** (`490a528f` is an
> ancestor of `df3aad73`, not a descendant), of which 13 are under `packages/*/test/**` and
> one, `packages/forge/tsup.config.ts:8`, was already in the existing gate's scope and is
> repaired ahead of this note.
>
> **Its two true positives are bare `t-` kebab slugs** — `t-build-steps-proxy-the-cli`,
> `t-canon-package-default` — the exact subset the fallback declares unreachable. The
> "unavailable" oracle finds both; the prohibition finds neither.
>
> **The ruling owed:** build the membership gate on the git-derived oracle, or keep the shape
> prohibition and accept it misses every observed bare-slug violation. Re-spec before
> dispatch — this is a different shard, not an edit to this one. What survives unrefuted is
> that _resolution_ is impossible (retirement deletes the content) and that a hand-maintained
> manifest is the wrong carrier; a **membership** test needs neither.
>
> **Blocked input:** `Inputs` names "the roster produced by `t-dead-designator-citations`".
> That roster was never produced as an artifact — it exists only as prose in `df3aad73`'s
> commit message. This shard is calibrated on a deliverable that does not exist.

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
