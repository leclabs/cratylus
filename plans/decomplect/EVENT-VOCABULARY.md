# The lifecycle vocabulary has two homes — execution spec

> **SUPERSEDED ON THE REMEDY, CORRECT ON THE DEFECT.** Read
> [`ARCHITECTURE.md`](../../ARCHITECTURE.md) first, then `PLAN.md` §2.
>
> The measurements below stand: two independent declarations, 28 members each, identical set and
> order, agreeing by coincidence with nothing enforcing it; consumers fully disjoint; nine members
> realizable on no harness, in symmetric pairs.
>
> **The base+extension split does not.** It put the base in `agent-runtime` to solve a dependency
> problem — runtime is the dependency root and cannot import canon. ARCHITECTURE dissolves that
> problem: **runtime receives corpus-specific facts as configuration the projection emitted**, the
> same way a memory strategy receives its backend selection. So the vocabulary is canon's outright.
> A lifecycle event is a NAME for a moment, and naming is signification.
>
> The section below arguing runtime should own the base is retained as the record of a wrong turn —
> its "runtime is the dependency root" reasoning is exactly the implementation-convenience argument
> that ARCHITECTURE exists to overrule. Do not execute it.

> Working handle, **not** an anchor. Reader = LLM. Every measurement below was taken, not estimated.

## Ownership — and a correction to an earlier over-read

An earlier revision of this spec claimed `MODEL.md:22` settled ownership against the corpus. **It does
not, and that citation was over-read.** `Event ≜ the harness-agnostic lifecycle vocabulary
⟨schema-owned ; the PIVOT every adapter maps from⟩` constrains the FORM — a schema owns the
vocabulary rather than scattered literals — and says nothing about which package hosts that schema. A
schema can live in a corpus. MODEL does not exclude the corpus reading.

The distinction that does decide it is **constitutive vs descriptive**.

- A **dimension is CONSTITUTIVE**. When canon declares `satisficing`, satisficing becomes part of that
  corpus's agent design; when it removes it, the concept genuinely leaves its agents. The corpus
  legislates, and the declaration is the act.
- A **lifecycle event is DESCRIPTIVE**. Declaring `turn.end` does not make turns end. Removing it does
  not stop them. The corpus is choosing only whether it has a NAME for a moment that occurs either
  way.

A corpus can legislate its own design. It cannot legislate what a runtime does. That is the whole
asymmetry, and it is why the catalog moved and the base vocabulary does not.

Two facts confirm it rather than motivate it:

- **`agent-runtime` is the dependency ROOT** — `agent-canon → agent-forge → agent-runtime`, and
  runtime declares zero workspace dependencies. Corpus ownership of the base vocabulary would require
  a cycle.
- **Runtime validates against the closed set AT RUN TIME**, in a deployed package with no build step:
  `capabilities/event-tap/dispatch.ts:66` refuses `tap install --events` naming an unknown event. It
  needs the set as runtime data, not as a projected artifact.

## But the corpus DOES own an extension — and this is the part already broken

The instinct that a corpus has a stake here is correct, and the evidence is already in the tree:
`SubstrateEvent = CanonicalEvent | 'vcs.commit.post'` (`core/hook/index.ts:32`). That literal exists
**because a canon cell needed it** — `agent-canon/src/hooks/praxis-continuity.ts:9` flags it verbatim:
_"FLAGGED for canon review: `vcs.commit.post` wants adding to the canonical event taxonomy."_

A corpus needed to name a lifecycle moment its design cares about, there was no seam for it, so the
projector hardcoded one literal. That is the same defect the dimension catalog had, one layer over —
and it means B10 is not a separate item, it is the missing half of this one.

**So the vocabulary is BASE + EXTENSION:**

- the **base** is runtime-owned, substrate-descriptive, and closed at the root of the dependency graph;
- a **corpus extends it** through the plugin, by exactly the per-key merge the catalog already uses,
  for moments its design wants governed;
- an extension no adapter can realize **degrades and warns** — the path already built and proven for
  constraints.

That gives the corpus a real, principled stake without inverting a dependency, and it retires the
hardcoded literal instead of blessing it.

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

## The extension seam — where `vcs.commit.post` actually goes

`SubstrateEvent = CanonicalEvent | 'vcs.commit.post'` is retired, not blessed. The corpus declares
that event on its plugin, beside its `anatomy`, and it carries its substrate with it — `Substrate =
'harness' | 'git'` is already declared one line above, and the union is the only place that ignores
the axis it sits next to.

Open question for the executor, to cold-decode rather than assume: whether an extension declares
`{ name, substrate }` or whether the substrate is inferable from the name's domain (`vcs.*`). Prefer
explicit unless the cold read says the domain prefix already carries it — a name that must be parsed
to be understood is a name doing two jobs.

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

Two legs, because the vocabulary has two owners:

1. **Base.** Add an event to `LIFECYCLE_EVENTS` in `agent-runtime`; it must appear in forge's
   `CanonicalEvent` with **zero edits to `agent-forge`**.
2. **Extension.** Declare an event on canon's PLUGIN; it must be usable in a cell's `events` with
   **zero edits to `agent-forge` and zero to `agent-runtime`**, and an adapter with no native peer for
   it must DEGRADE and warn rather than crash — the path already proven for constraints.

Then remove both and confirm the renders return byte-identical. Leg 2 is the one that matters: it is
what `vcs.commit.post` needed and could not have, and a base-only fix would leave that literal
hardcoded with a nicer provenance.

## Hazards

- **The two lists agree TODAY.** Every check will pass before and after step 2, so byte-identity
  proves nothing here. Step 1's gate is the only thing that can fail, which is why it comes first.
- **`agent-runtime` is DEPLOYED, forge is build-time.** Anything moved into runtime ships to every
  host. Move the vocabulary, not forge's machinery.
- **Do not import forge from runtime.** That edge does not exist and creating it would be the real
  regression — worse than the duplication, because a deployed package would start depending on a
  build tool.
- **Both renders are the regression oracle**: `fe084dd1d531948979dc386713c3f688c96088ab`.
- **Do not let the base absorb the extension.** Folding `vcs.commit.post` into `LIFECYCLE_EVENTS`
  would make every check pass while re-committing the original error: a corpus's need answered by
  editing the root package. The extension seam is the deliverable; the base move is the setup.
