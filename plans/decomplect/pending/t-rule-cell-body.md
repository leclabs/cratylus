# `body` means two things in two sibling files, and a class was minted to route around it

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

## The collision

`schema/src/rule-cell.ts:28` — _"Verbatim directive body"_ → `readonly body`.
`schema/src/hook-cell.ts:13,73` — `body = ⟨α, residue⟩`, MODEL's sense.

**Same directory. Both authored surfaces. One sign, two concepts.**

The tell is already in the tree: `canon/test/reader-density.test.ts:253` carries a ρ-class
`'rule-target-body'` — minted specifically to avoid the collision rather than to name something.
A sign that exists to disambiguate another sign is the collision's receipt.

## Blast radius

1 field, and `git ls-files packages/canon/src/rules/` → **1 file** (`repo-preamble.ts`). Plus the
ρ-class name, which changes with it.

**Small, and that is the point: it is cheap now and gets more expensive with every rule authored.**

## Why it is blocked

Requires a **mint** for the payload concept — the thing a rule literally says. Not mechanical.

## Acceptance

- The payload concept's anchor is DISCOVERED, not picked from a shortlist.
- `MODEL.md`'s `body` is left alone; if the derivation collides with it again, that is the finding.

## ▶ RULING 2026-08-05 — `content`. A discovered coalesce; the "needs a mint" premise is REFUTED.

**First, a correction to this shard's own filing: `HookCell` has no `body` field.** `body` appears in
`hook-cell.ts` only as MODEL prose; the field is `residue`. The real occupant of `body` is
`Enforcing.body` + `bodyOf()`/`anchorOf()` in `schema/src/index.ts`, where `body(c) = ⟨α, residue⟩`.
**`RuleCell.body` is the sole intruder** — a narrower and cleaner finding than the one filed.

The concept already has a home. `HookWorker.content` is glossed _"Verbatim worker bytes — the source
of truth for `targetPath`"_; `RuleCell.body` is glossed _"Verbatim directive body — the source of
truth for `targetPath`"_. **Identical D, adjacent files, same package.** `HarnessProjection` returns
`{filename, content}` for the same sense. A blind cold reader ranked `content` first, noting the
sibling makes it _"an established local idiom … the byte-lock invariant parallel and self-evident,"_
and that `body` _"would fire the wrong prior first."_

So there is nothing to mint. `directive` over-claims structure and under-claims verbatimness;
`payload` reads as cargo-to-be-decoded; `source` inverts the byte-lock.

The ρ-class `'rule-target-body'` → `'rule-target-content'` stops being a disambiguation receipt and
becomes an honest density class — it still earns its existence, since `workers[].content` is source
code while rule content is R=LLM prose.

**Still sequenced behind `t-definiens-vs-residue`**: once `definiens`→`residue` lands, `RuleCell` and
`HookWorker` are literally isomorphic (`residue` + `content` + `targetPath`) — which is the
structural proof this ruling is right, and the cheapest moment to make the parallel explicit.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 2
- **depends on** `t-definiens-vs-residue`
- **writes** `packages/canon/src/rules/**`
- **compiles against** `packages/schema/src/rule-cell.ts`
- **evidence** `packages/schema/src/rule-cell.ts` · `MODEL.md`
- **dispatchable** no ruling owed
