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

## ▶ RULING 2026-08-05 — `event-tap` ≡ `eventTap`. They are ONE sign in two registers. `tap` is REJECTED.

The corpus **already declares the kebab↔camel map** (`core/anatomy-body.ts:25`, `dimensionField`)
and runs it live for `situation-awareness`↔`situationAwareness`. So there were never three signs —
there are two, and only `tap` is a genuine second one.

**`tap` fails circumscription**: fired(`tap`) ⊊ D(c) — it carries _passive siphon on a stream_ but
not **which** stream. A blind cold reader, unprompted: _"`mytool tap install` reads as a Homebrew
tap; the flag is doing the naming, which means the name isn't."_ σ\* is argmin over **circumscribing**
names, so `tap` never enters the competition despite being shortest. The tree already agrees:
`claude.ts:38` writes ``TAP_ID = `${RUNTIME_BIN}-event-tap` `` — the shipped **value** is the full
sign; only the identifier was abbreviated.

**The proposed gate loses TWO axes, not one — and the second is a correction beyond the census:**

- **`dir ≡ keyspace` — DROP.** It is **1-for-2 in both directions**: `memory` is in `CAPABILITIES`
  with no `capabilities/memory/` dir, and `provisional-v9/` is a dir outside the keyspace.
- **`≡ canon skill name` — DROP** (1→N), **replaced by the subset direction**, which has 4 positive
  controls: `∀ skill · skill.runtime.capability ∈ CAPABILITIES`.
- **KEEP** `ports/<sign>.ts` basename ≡ keyspace member (2-for-2) and plugin `name:` ≡ sign (2-for-2).

**The exemption is stated as a RULE, not a special case**: a `ports/*.ts` module is outside the
keyspace **iff** its basename carries the `provisional-` prefix — which is not a name, and says so
in its own file. **Gate the biconditional**, so it self-arms for future capabilities and cannot be
satisfied by quietly adding a second hand-written exception.

94 sites / 16 files. `main.ts:80` drops `first === 'tap' ||`; operators typing `tap` get a loud
unknown-capability, which is the kernel's own fail-loud contract. Settles
`t-shim-path-from-capability`'s 5 `eventTap.mjs` literals for free.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** event-vocabulary · **wave** 1
- **depends on** `t-capture-row` · `t-manifest-file-basename`
- **writes** `packages/runtime/src/loader.ts` · `packages/runtime/src/main.ts` · `packages/canon/src/skills/event-tap/**`
- **compiles against** `packages/runtime/src/ports/provisional-v9.ts`
- **evidence** `packages/runtime/src/loader.ts` · `packages/runtime/src/ports/provisional-v9.ts`
- **dispatchable** no ruling owed
