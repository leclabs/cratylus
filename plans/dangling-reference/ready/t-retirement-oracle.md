# t-retirement-oracle

**Wave 1.** The gate `veracity` declared unbuildable. Blocked on both repair shards: landing
it while violations stand reds the pipeline for correct work.

## Intent

A shard designator cited in a live source is a warrant no reader can follow, and it becomes
one silently — at the retirement of the plan, in a commit that touches neither the citing file
nor anything near it.

**Its predecessor concluded no gate was possible. That conclusion was wrong**, and the
refutation is the whole reason this shard exists:

- **The oracle is a set difference, hand-maintained by nobody:**

  ```
  dead(D) ⇔ D ∈ basenames(*.md ever under plans/**/{pending,ready,active,completed}/, from git)
          ∧ D ∉ basenames(present in the worktree)
  ```

  439 retired ids, **26 ms**, zero stored state. `packages/canon/src/toolkit/plan-set.ts:287`
  already ships this exact `derived-on-demand-never-stored` discipline for `retirement(P)`,
  and `f958d9b9` ruled FOR it when it deleted the hand-written `.landed` carrier.

- **"Git has the wrong polarity" answered the wrong query.** The gate does not ask _did D ever
  exist_ — it asks _is D live_, a two-source conjunction: git supplies the historical leg, the
  worktree the live leg, dead is the difference. On `plans/ = ∅` every historical id reads
  dead, which is the CORRECT answer — making this oracle MORE empty-set-immune than a shape
  prohibition, not less, since the historical leg is never empty.

- **Cratylism gives shard and concept the same STEM, not the same SIGN.** praxis qualifies an
  id with the work: `plan-path` is a shard named `plan-path-veracity`. **0 of 439 retired ids
  equals a live file stem.** Exact-id matching on word boundaries over 558 live files yields
  **9 hits: 2 true positives, 3 fixture mentions, 4 genuine collisions** (`cold-decode`,
  `explicit-omit-to-inherit`, `extend-reach`, `root-cause`) — 0.91%, discharged by a
  four-name exoneration list.

What genuinely does not exist is **resolution**: retirement deletes, so nothing recovers a
designator's CONTENT without a git blob read. A membership test needs neither resolution nor
a manifest.

## Inputs

- `packages/canon/src/toolkit/plan-set.ts` — `retirement()` `:287`, `absentAt()` `:264`,
  `retired()` `:311`, `touchingCommits()` `:221`, and its header's argument that the carrier
  for "retired" is the retiring commit.
- `packages/canon/test/command-veracity.test.ts` — `authoredLines()` (THE ONE WALK), `inScope`,
  `isTranscript`, and the reach/convict/exonerate structure both existing laws use.
- `packages/canon/test/gate-convicts.test.ts` — the meta-gate this law must satisfy.
- The scope ruling written down by `t-test-dangling-references`.

## Constraints

- **Reuse `authoredLines()`.** Its docstring states the property: _"neither walks the tree a
  second time, so a scope ruling argued once cannot come apart between them."_ Add a
  predicate, not a traversal.
- **The oracle is derived, never stored.** No retirement manifest, no checked-in id list.
  `f958d9b9`: _"a carrier maintained by hand is not a readout of the world, it is a claim
  about it that rots the moment someone forgets the verb."_
- **Three legs, and the reach leg counts the DENOMINATOR** — how many ids the oracle
  enumerated and how many files were walked. A citation-counting reach leg reads green for
  having looked at nothing once the repair shards land.
- **Both fixtures.** Convicting proves it bites; **exonerating** proves it does not bite
  wrongly, and must include the four measured collisions.
- **A REPAIR THAT EXPLAINS ITSELF RE-MINTS THE TOKEN IT REPAIRED.** Discovered independently
  by both wave-0 shards while executing. Honest post-mortem prose — _"this cited `plan X S6`,
  which is dead"_ — is a MENTION, and a shape-decidable gate cannot tell it from a USE. Both
  executors hit it and both chose to carry the fact WITHOUT respelling the id, rather than
  argue an exemption, because an exemption list is a hand-maintained carrier that rots.
  **Design the gate so that choice stays cheap**: the closed-record exemption
  (`fixtures/turn-*.txt`, captured banners) does NOT cover a source comment, and widening it
  to cover explanatory prose would blind the gate to the commonest real violation — an author
  citing a warrant in a header. State this ceiling where the law lands.
- **The scope ruling already exists.** `t-test-dangling-references` wrote the use/mention
  distinction into `command-veracity.test.ts`'s SCOPE header, beside the `**/test/**`
  exclusion it qualifies, and deliberately left `inScope` unchanged. Read it before deciding
  the scope; it is this shard's decision to make and the argument is already assembled.
- **Re-derive every number in this file before relying on it.** 439, 9, 4 and 26 ms are
  measurements with a timestamp. The predecessor shard died of quoting a decayed count
  forward: its `413` was irreproducible under twelve definitions, and its `192/413` had an
  exact ratio with both absolutes wrong.

## Deps

- `t-src-dangling-references`
- `t-test-dangling-references`

## Outputs

- `packages/canon/src/toolkit/**` (the oracle)
- `packages/canon/test/command-veracity.test.ts` (or a sibling, argued if split)

## Accept

1. The oracle enumerates the retired-id set from git alone, stores nothing, and prints its
   cardinality. Runtime under 1 s on this repo.
2. On `plans/ = ∅` the gate runs and reports every historical id dead — it does NOT throw,
   and it does NOT read green for having found nothing. A test asserts this directly; the
   empty plan set has bitten this corpus five times.
3. A convicting fixture (a live source citing a genuinely retired id) reds the gate.
4. An exonerating fixture containing all four measured collisions stays green.
5. `pnpm verify` green with zero violations at HEAD, and `gate-convicts.test.ts` satisfied.
