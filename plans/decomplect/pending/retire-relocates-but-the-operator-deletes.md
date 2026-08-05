# `retire` is canonized as RELOCATION and was just performed as DELETION

> Surfaced 2026-08-05, immediately after `plans/.retired/` was deleted on operator instruction —
> "retire all retirable plans by deleting them to reduce the cognitive noise." The deletion was
> carried out. The law it contradicts was not touched, because amending a law to match an act is
> how a corpus stops being a corpus.

## The contradiction, in the corpus's own words

`packages/canon/src/skills/praxis/skill.ts:159`:

```
retire : P ↦ P' ≜ relocate dir(P) under plans/.retired/ ; pre terminal(P) ;
                  post phase(P) = retired ∧ content(P') = content(P)
```

`content(P') = content(P)` is a **postcondition that deletion cannot satisfy**. And `archived(P) ⇔
dir(P) @ plans/.retired/` (`skill.ts:59`) makes `retired` a claim about RESIDENCE — a deleted plan
resides nowhere, so its phase is not readable at all.

The mechanism agrees with the law, not with the act: `plan-set.ts:32` exports `RETIRED_DIR`,
`plan-set.ts:338` implements `retire` as a `git mv`, `praxis.sh:136-138` `mkdir -p`s the container.
Nothing anywhere implements deletion. **The next `retire` will recreate `plans/.retired/`**, and the
tree that was just cleared will start refilling.

## Why this is a ruling and not a bug

Three readings of the instruction, and they are not the same change:

1. **One-off cleanup.** The already-retired backlog was noise; `retire` keeps meaning relocation.
   Nothing to change — but then the tree refills, and the same instruction recurs. This is the
   cheapest reading and the one the act alone supports.
2. **`retire` means delete.** The law is rewritten, `RETIRED_DIR` and the `.retired/` container die,
   `phase = retired` becomes underivable from disk and needs another carrier (or the phase is
   dropped: a plan is either in-scope or gone). This is a real canon change touching the praxis
   cell, `plan-set.ts`, `praxis.sh`, and two gates.
3. **Two verbs.** `retire` relocates (the reversible, auditable step) and a new verb — `discard`,
   `drop`, whatever the round-trip returns — deletes. The plan set gets an explicit "this record is
   not worth keeping" act, distinct from "this plan is done."

**Reading 3 is what the evidence actually points at**, and it is offered as the pick rather than the
answer: the operator's stated reason was _cognitive noise_, which is about the READING SURFACE, not
about the plan's lifecycle. Those are two different properties and one verb currently carries both.
Note the name in reading 3 is **underived** — it must go through the round-trip, not be assumed.

## What is NOT in question

The deletion itself. Git holds every byte; `git log -- plans/.retired/` reaches all 127 files. The
same argument that chose _marking_ over _restoring_ for the retro-fitted record applies harder here:
what left the working tree is the reading cost, not the record.

## Acceptance

- One reading is chosen and the corpus states it. If reading 2 or 3: the praxis cell, `plan-set.ts`,
  `praxis.sh` and the two gates that read `.retired/` agree, and no artifact still asserts a
  postcondition the verb does not establish.
- If reading 3: the new verb's sign is DERIVED — forward argmin, blind reverse decode, occupancy
  check — not picked from this file's three candidates.
- If reading 1: nothing changes, and that is recorded here so the next cleanup does not re-open it.
- `phase(P)` remains a readout of ground truth on disk, or its new carrier is named explicitly.

## ▶ RULING 2026-08-05 — `retire` means DELETE. No new verb. My own pick was wrong.

This shard argued for two verbs. **A law already in the cell refutes it**, and I had not read it
closely enough when I filed:

> `praxis/skill.ts:110` — `retire(P) defined ⇔ terminal(P) ∧ drained(yield(P))`

`drained` means _every_ intent authored into its strongest seam. **If retire may only fire once the
plan's yield is already in the canon, `content(P')` is by construction pure redundancy** — the
archive preserves nothing the corpus does not hold, and git holds the bytes regardless. A second
verb would therefore exist only to serve **un-drained** records, which `retire` already forbids.
Reading 3 is one verb plus an escape hatch from the strongest law in the cell.

**`phase` stays a readout of ground truth.** `Plans ≜ { P | P a plan on disk }`, so a deleted plan
simply leaves the set — `phase` was never total over non-members. The carrier for the _fact_ of
retirement is the retiring commit, and **the corpus has already made exactly this move once**:
`landing : P ⇀ commit` is recomputed from VCS on every call and stored nowhere. `retires(c, P)` is
its twin.

Reading 1 is refused as self-defeating: nothing implements deletion and two code paths `mkdir` the
container, so the next `retire` refills the tree the operator just cleared and the instruction
recurs forever.

**Had a new verb been needed, its name would have had to be DERIVED** — never picked from this
shard's own `discard`/`drop` slate, which is a candidate list, not a result.

**Three gates change, and one of them must DIE rather than warn**: `plan-set.test.ts`'s live
`.retired/` leg loses its subject permanently, and its "could not look" branch — correct as a
temporary state — becomes dishonest as a permanent one. **The render oracle MOVES** (`praxis/skill.ts`
is a projected cell); re-baseline deliberately, in its own commit.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** plan-machinery · **wave** 2
- **depends on** `t-anatomy-root-compose`
- **writes** `packages/canon/src/skills/praxis/**` · `packages/canon/src/toolkit/praxis/**` · `packages/canon/src/toolkit/plan-set-cli.ts`
- **compiles against** `packages/canon/src/toolkit/plan-set.ts`
- **evidence** `packages/canon/src/skills/praxis/skill.ts` · `packages/canon/src/toolkit/plan-set.ts`
- **dispatchable** no ruling owed
