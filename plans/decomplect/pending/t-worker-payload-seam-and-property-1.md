# Property 1's last breach and the homeless hook message are ONE design question

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

> **This shard MERGES `hook-message-has-no-declared-home` into the property-1 ruling.** The census
> established they are the same question wearing two filings: both ask how a hook cell carries
> content that is neither code nor configuration but BYTES A READER RECEIVES.

## Half one — the pinned breach

`canon/src/hooks/memory-consolidation-nudge.ts:**1**` (ground says `:2`; that is the schema import)
imports `RUNTIME_BIN` from `@cratylus/runtime`. It is consumed at `:96` inside the worker payload:
`MEM="\${MEMORY_BIN:-${RUNTIME_BIN}}"`, with the rationale at `:38-41`: _"the worker names it
inside a shell string no compiler reads."_

**The trap is tighter than recorded — five assertions go red, and both exits are closed on purpose:**

| site                                   | effect                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `bin-name-single-home.test.ts:98`      | requires `RUNTIME_BIN` **in the cell's source**                                 |
| `bin-name-single-home.test.ts:94-97`   | forbids the cell from **spelling the literal**                                  |
| `bin-name-single-home.test.ts:153-154` | the interpolation must equal `RUNTIME_BIN` in **both** cell and committed `.sh` |
| `architecture.test.ts:396-399`         | asserts breach **count** = 1 — fails on repair even with the pin removed        |
| `architecture.test.ts:445-455`         | shrink-only — **leaving** the pin after repair also fails                       |

`:98 ∧ :94-97` together admit exactly one mechanism: importing it. **The import is required by
construction.**

## Half two — the message has no field

`HookCell` declares `id`, `residue`, `substrate`, `events`, `timeout`, `entry`, `refs`, `workers`;
`HookWorker` declares `filename`, `targetPath`, `content`, `executable`. **No message field.** So
what a hook SPEAKS to an agent lives as `printf` bodies in shell —
`resume-availability-notice.sh:15`, `memory-consolidation-nudge.sh:67,70`,
`praxis-advance-nudge.sh:46-51`. `reader-density.test.ts:98-104` carries a KNOWN GAP paragraph
saying exactly this, and `:206-210` restates it.

## Why they are one question

The obvious property-1 repair — let forge interpolate `RUNTIME_BIN` at projection time — is **not
free**. `workers[].content` is a **committed byte-anchor**, regenerated to a `.sh` and byte-locked by
`hook-rule-boundary.test.ts`. Moving the bin name out of it changes what "byte-lock" MEANS for that
class: a change to the cell/worker contract in `schema`, not a refactor. And that is precisely the
contract the homeless-message shard needs changed.

**Answer them together or answer neither.**

## Acceptance

- A named seam by which a cell obtains projection-owned values without importing the mechanism package.
- An emitted-artifact-level assertion SURVIVES. `ARCHITECTURE.md:166-167`: _"the gate's coverage stops
  at the language boundary, and the emitted-artifact sites are exactly where a missed rename fails on
  a host rather than at build."_ This session paid that bill in person.
- `architecture.test.ts` count and pin amended in the same act as the repair — mechanical, but only
  after the design lands.
- The KNOWN GAP paragraph in `reader-density.test.ts` is deleted, not edited.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 2
- **depends on** `t-anatomy-root-compose`
- **writes** `packages/schema/src/hook-cell.ts` · `packages/canon/src/hooks/**` · `packages/canon/src/toolkit/guardrail/**`
- **compiles against** `packages/runtime/src/bin-name.ts`
- **evidence** `packages/canon/src/hooks/memory-consolidation-nudge.ts` · `packages/canon/test/bin-name-single-home.test.ts` · `ARCHITECTURE.md`
- **dispatchable** no ruling owed
