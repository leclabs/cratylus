# One capability, three signs — and both halves of the proposed remedy are wrong

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution** —
> the target of a move is indeterminate until it is made.

## The three signs

| sign        | site                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| `eventTap`  | `runtime/src/loader.ts:33` — `CAPABILITIES = ['memory','eventTap']`      |
| `event-tap` | `capabilities/event-tap/index.ts:34` `name:` + the directory basename    |
| `tap`       | `dispatch.ts:21` `TapVerb`, `:85` `dispatchTap`, `claude.ts:38` `TAP_ID` |

`main.ts:80` accepts two of them at once (`first === 'tap' || first === 'eventTap'`), with a
production-failure record at `:72-79` explaining why.

## Two corrections to the filed remedy — both measured

The filing proposes gating `keyspace ≡ name ≡ dir ≡ verb ≡ **canon skill name**`.

1. **That last axis has NO positive control.** The `memory` capability is claimed by **three** skills
   — `dream`, `handoff`, `wake` — and **none is named `memory`**. `capability` is 1→N over skills;
   the equality as written is false, and the sweep's own exemplar fails it.
2. **A third capability directory exists and is deliberately outside the keyspace.**
   `runtime/src/capabilities/provisional-v9/` is absent from `loader.ts` because
   `ports/provisional-v9.ts:7` refuses to register on an underived anchor. Any `dir ≡ keyspace` gate
   must exempt it — **and that exemption is itself a design decision**, not a detail.

## Blast radius

14 files / 56 sites; ~8 are anchor-bearing authored surface. `canon/src/skills/event-tap/skill.ts`
is a shipped cell — **the render oracle moves.**

## Downstream

Settles the 5 `scripts/eventTap.mjs` literals in `t-shim-path-from-capability` for free: the literal
is `f(capability)`.

## Acceptance

- The anchor is ruled, and the gate's axes are only those with a positive control.
- The `provisional-v9` exemption is stated as a rule, not a special case.
- Oracle re-baselined deliberately, diff quoted.
