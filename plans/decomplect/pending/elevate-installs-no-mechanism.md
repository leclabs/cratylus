# `elevate` asserts a loop-position and installs nothing

> Filed, not fixed — a defect beside the path. `cost(file) < cost(fix)`.
> Provenance: canon-candidate drained from mav's EPISODIC at handoff; corroborated
> first-hand in the originating session (below).

## Symptom

`carry-on` asserts `loop-position := out-of-the-loop` and **installs no mechanism**.

A skill is text in context. Text is advisory. In this harness the only thing that can
prevent a turn from ending is a **Stop hook**. So an assertion of elevated autonomy
carries exactly as far as the model's compliance with prose — which is the property the
elevation exists to stop depending on.

## Locus

`packages/canon/src/skills/carry-on/skill.ts` — the SOURCE cell. Never the
`~/.claude` render, which is a projection.

## The shape of the fix (not a prescription — the cut is the executor's)

Two parts, separable:

1. **`elevate` gains an install step.** `elevate ≜ … ∧ install(stop-hook, ¬terminus(P))`;
   `terminus ⇒ release`. The mechanism has to exist for the duration of the elevation and
   be removed at its end.

2. **The bound condition must be the plan TERMINUS predicate** — `done(P) ∨ fork⊥` — which
   is _checkable_. It must not be a stance description, because a stance can only be judged
   _after_ a check-in-shaped message has already been emitted, i.e. after the failure.

Companion rule needing no hook: a turn may end only on terminus, on a surfaced `fork⊥`, or
with forward work in flight.

## Corroboration from the originating session

The session that drained this record ran with the `stance-guardrail` Stop hook active and
was blocked by it repeatedly. Two observations worth carrying into the fix:

- **The mechanism is what enforced.** Every correction came from the Stop hook, never from
  skill text asserting a stance. This is direct evidence for part 1.
- **Span-matching mis-fires are frequent and load-bearing.** Several blocks matched an
  _interstitial_ line that preceded tool calls the agent then made — narration mid-turn read
  as the turn's close. A terminus predicate (part 2) is immune to this; a stance judgement
  over emitted text is not. This is direct evidence for part 2, and it is the stronger of
  the two findings.

## Acceptance

- `elevate` cannot succeed without the mechanism being installed; a test proves the
  un-installed path refuses rather than silently asserting.
- The bound condition is evaluated from plan state, never from message text.
- Release removes what elevate installed; no residue on terminus.

## ▶ RULING 2026-08-05 — the predicate is four disjuncts read from disk; the mechanism is a RUNTIME CAPABILITY

```
terminus ⇔ ¬∃P: bound(P)                            -- .bound absent ⇒ nothing elevated
         ∨ done(P)                                   -- open state dirs empty ∧ completed ≠ ∅
         ∨ fork⊥(P)                                  -- a MARKER at dir(P) — see below
         ∨ (sharded(P) ∧ ¬done(P) ∧ frontier(P) = ∅) -- R ill-formed · SURFACE
```

Three of four are readable today. **`fork⊥` has no carrier — that is the whole gap**, and this
corpus has minted this exact thing twice: `praxis.sh` states the pattern in its own words —
_"a relation with no on-disk carrier is not readable … `.landed` is that carrier, exactly parallel
to `.superseded-by`."_ Mint the third; **its sign must be DERIVED, not assumed from the `fork⊥`
notation.**

**The fourth disjunct is not optional.** Without it a mis-cut plan wedges the session forever —
the failure `stance-guardrail` had to retrofit a block-cap and a no-progress detector to escape.
Build it in from the start.

This design is immune to the shard's own strongest finding: every span-matching misfire is a
property of judging _emitted text_, and nothing above reads a transcript.

**Not a canon `HookCell`.** `stance-guardrail` is projected at BUILD time into `settings.json` and
is permanently resident — a build-time projection cannot be installed by `elevate` and removed by
`release`. The fitting precedent is **`eventTap`**: a runtime capability whose cell already
declares `install`/`uninstall` and the law _`uninstall ∘ install ⊨ target ≡ target₀ ∧ foreign
preserved ⟨zero residue⟩`_, implemented as an id-keyed surgical filter. That is this shard's
"release removes it with no residue", already built and already gated.

**Two corrections to this shard's own Execution block, both caught by the ruling:**

1. It writes `packages/runtime/**` too — the mechanism is runtime's, not only the cell's.
2. It must **not** compile against `canon/src/toolkit/plan-set.ts`. `architecture.test.ts`'s
   property 4 (_runtime depends on nothing_) rejects any runtime→sibling edge; importing plan-set
   would re-run the property-1 defect this plan is already carrying a shard for. The plan root and
   the state-folder names reach the capability as **projected configuration**, sourced from canon's
   one home `toolkit/plan-states.ts`.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** plan-machinery · **wave** 1
- **depends on** `t-anatomy-root-compose` · `t-lifecycle-vocabulary`
- **writes** `packages/canon/src/skills/carry-on/**` · `packages/runtime/src/capabilities/**`
- **compiles against** `packages/canon/src/toolkit/plan-states.ts`
- **evidence** `packages/canon/src/skills/carry-on/skill.ts` · `packages/canon/src/hooks/stance-guardrail-pre.ts`
- **dispatchable** no ruling owed
