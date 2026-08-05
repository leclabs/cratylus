# `accept()` admits five Kinds; MODEL declares four

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

## The state

`forge/src/validate/accept.ts:52` — `readonly kind: 'fragment' | 'agent' | 'skill' | 'rule' | 'hook'`
`MODEL.md:10` — `Kind ≜ {fragment, agent, rule, skill}`

**And the counter-argument is already written**, in `schema/src/hook-cell.ts:6-10` (moved from canon
by `48baaddd`), which cites MODEL and states that a hook _"is not a Kind of thing the canon authors."_

## Why this is not a one-line fix

The blast radius is 1 type line plus its `AcceptCell` constructors — **but removing the member is a
ground-conformance ruling, not a rename**: it answers _does `accept()` gate hooks at all?_ If it
should, MODEL is wrong. If it should not, the constructors that pass `kind:'hook'` are.

`PLAN.md` names this "the cheapest seed" of a ground-conformance property that **does not yet exist**.
That property is the actual deliverable here.

## The ruling owed

State the property first: _what makes a divergence between a ground enumeration and a source
enumeration a defect rather than a refinement?_ Without it, this is one arbitrary edit and the next
divergence is unconvictable.

## Acceptance

- The property is stated before the member moves either way.
- Whichever side changes, the other is checked by a gate — not by having been read once.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** projection-and-ground · **wave** 1
- **depends on** `t-soul-to-target-in-forge`
- **writes** `packages/forge/src/validate/accept.ts` · `MODEL.md`
- **compiles against** `packages/schema/src/hook-cell.ts`
- **evidence** `packages/forge/src/validate/accept.ts` · `MODEL.md`
- **dispatchable** no ruling owed
