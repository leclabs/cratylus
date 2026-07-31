# The lifecycle vocabulary has two homes — execution spec

> Working handle, **not** an anchor. Reader = LLM. Every measurement below was taken, not estimated.

## This OVERRIDES the audit's B9 — with a ground citation

`BACKLOG.md` files B9 as _"`CanonicalEvent` … belongs to canon."_ **That is wrong**, and acting on it
would have moved a schema-owned vocabulary into a corpus.

`MODEL.md:22` — `Event ≜ the harness-agnostic lifecycle vocabulary ⟨schema-owned ; the PIVOT every
adapter maps from⟩`.

The ground already assigns it, and assigns it to a **schema**, not to a corpus. The contrast with the
dimension catalog is exact and is why that refactor went the other way: MODEL declares
`catalog : DimensionName → ℘(fragment)` as a FUNCTION and never fixes its domain, so WHICH dimensions
exist is open and corpus-owned. `Event` is fixed vocabulary. A corpus does not get to invent
`session.start` — sessions exist whether or not anyone authored a design.

Per the apex order, a derived audit finding loses to MODEL. The audit saw a real defect and misnamed
its remedy.

## The actual defect, measured

**Two independent declarations of one schema-owned vocabulary, agreeing by coincidence.**

|                                       | where                                                                      | members |
| ------------------------------------- | -------------------------------------------------------------------------- | ------- |
| `CanonicalEvent`                      | `agent-forge/src/core/hook/generated.ts`, compiled from `hook.schema.json` | 28      |
| `LIFECYCLE_EVENTS` / `LifecycleEvent` | `agent-runtime/src/events.ts`, hand-authored                               | 28      |

Compared directly: **same 28 members, same order, zero divergence** — and _nothing enforces that_.
Neither is generated from the other; neither is tested against the other. They agree because two
authors happened to write the same list.

`agent-runtime/src/events.ts` calls itself _"the one authority for the vocabulary"_ while
`hook.schema.json` is a second authority saying the same thing. Two artifacts each claiming to be the
one home is worse than either claim being false: the claim is what stops a reader looking for the
other.

Consumers, disjoint: **9 forge files** read `CanonicalEvent`; **5 runtime files** read
`LifecycleEvent`. No file reads both, which is precisely why the duplication has never surfaced.

## The seam — which home wins

**`agent-runtime` owns the vocabulary; `agent-forge` derives from it.**

Three independent reasons, all checked:

1. **The dependency already flows that way.** `agent-forge/package.json` declares
   `"@leclabs/agent-runtime": "workspace:*"`; `agent-runtime` declares no dependency on forge.
   Runtime→forge needs no new edge; forge→runtime would need an inverted one.
2. **The vocabulary describes the RUNTIME.** `session.start` is a fact about what an agent runtime can
   notify about — it exists at run time, in a deployed agent, whether or not anything was ever
   projected. Forge's need for it is downstream: it maps this pivot onto each harness.
3. **Runtime already says so.** Its own header claims the authority. Make the claim true rather than
   move it somewhere neither package can reach.

MODEL's `⟨schema-owned⟩` is satisfied either way — a schema can live in `agent-runtime`. What MODEL
forbids is what exists today: two hand-kept homes, neither generated from the other.

## The change

`agent-runtime/src/events.ts` becomes the single source: `LIFECYCLE_EVENTS` stays the authored tuple,
`LifecycleEvent` stays derived from it. Then:

- **`hook.schema.json` stops enumerating events.** Its `event` property references the vocabulary
  rather than restating it — the generator reads `LIFECYCLE_EVENTS` and emits the enum into the
  schema, or the schema drops the enum and `generated.ts` imports the union from runtime. Prefer the
  second: fewer moving parts, and it makes the import edge visible in the type.
- **`CanonicalEvent` becomes an alias** of runtime's `LifecycleEvent`, re-exported from
  `core/hook/index.ts` so forge's 9 consumers do not change.
- **`generate.ts` travels with whatever remains generated**, per its own header: _"the schema, the
  generator, and the emitted `generated.ts` are one unit that moves together."_ If nothing is left to
  generate for events, say so and delete it rather than leave a generator over an empty domain.

## The widening (B10) rides along, and is a REAL open question

`core/hook/index.ts:32` — `SubstrateEvent = CanonicalEvent | 'vcs.commit.post'`. One literal, hardcoded
in forge, widening a vocabulary forge will no longer own. Canon's own cell flags it:
`agent-canon/src/hooks/praxis-continuity.ts:9` — _"FLAGGED for canon review: `vcs.commit.post` wants
adding to the canonical event taxonomy."_

**Do not silently fold it in.** Two candidate resolutions, and this one is a genuine design question
rather than a mechanical move:

- `vcs.commit.post` IS a lifecycle event of a different SUBSTRATE (git), so the taxonomy grows a
  substrate axis and the union stops being ad-hoc; or
- the harness vocabulary and the git vocabulary are two vocabularies, and `SubstrateEvent` is
  correctly their sum — in which case the git side deserves its own declared enumeration rather than
  one inline literal.

Cold-decode it before choosing. `Substrate = 'harness' | 'git'` already exists beside it, which is
evidence for the first reading: the substrate axis is declared, and the event union is the only place
that ignores it.

## Order of execution — each step lands green on its own

1. **Gate the coincidence FIRST, before changing anything.** Add a test asserting the two lists are
   identical in members and order. It must PASS today — that is the point. It converts an accident
   into a checked invariant, and if any later step diverges them, it fires. Verify it convicts by
   perturbing one list and watching it fail.
2. **Point forge's type at runtime's.** `CanonicalEvent = LifecycleEvent`, re-exported. Both renders
   byte-identical; the gate from step 1 now compares a thing to itself and should be simplified or
   deleted with its reason recorded.
3. **Resolve the schema.** Either the schema references the vocabulary or the enum leaves the schema.
   Keep `generate.ts` and its output in one unit, or remove both.
4. **Decide `vcs.commit.post`** as its own act, with the cold-decode written down.

## Completion criterion — empirical

Add a lifecycle event to `LIFECYCLE_EVENTS` in `agent-runtime`, and it must appear in forge's
`CanonicalEvent` with **zero edits to `agent-forge`** — usable in a `HookCell`'s `events`, and
reported as unrealizable by an adapter that has no native peer for it (the degradation path, not a
crash). Then remove it and confirm both renders return byte-identical.

## Hazards

- **The two lists agree TODAY.** Every check will pass before and after step 2, so byte-identity
  proves nothing here. Step 1's gate is the only thing that can fail, which is why it comes first.
- **`agent-runtime` is DEPLOYED, forge is build-time.** Anything moved into runtime ships to every
  host. Move the vocabulary, not forge's machinery.
- **Do not import forge from runtime.** That edge does not exist and creating it would be the real
  regression — worse than the duplication, because a deployed package would start depending on a
  build tool.
- **Both renders are the regression oracle**: `9055e88b6c4679e44fb5ccb73371b9d539d1d6a8`.
