# t-ground-row-truth

**Wave 0.** `ARCHITECTURE.md`'s divergence table carries a repaired condition as live,
and the paragraph beneath it overclaims what holds the table honest. Output is
`ARCHITECTURE.md` alone — disjoint from `t-dead-designator-citations`.

## Intent

Two defects in one place, both of the class this corpus produces most: **a claim ABOUT an
artifact, riding an unchecked path.**

**(1) A stale row.** The table row reading _"the lifecycle vocabulary is declared twice —
forge and runtime, independently. 28 members each, identical set and order, nothing
enforcing it"_ describes a condition that was **repaired at `2b4a87d0` and gated at
`packages/canon/test/event-vocabulary.test.ts`** (three legs: sole-declaring-site census,
adapter-key conformance, and a deploy→runtime config round trip). `runtime/src/events.ts`
now declares `export type EventName = string` and carries a header explaining why the
members left. Every other repaired row in the table is struck through and marked
`REPAIRED 2026-08-05`. This one was not.

Note the row is also **wrong on its own terms about which two sites**: the header in
`runtime/src/events.ts` records the duplication as runtime ↔ **schema**, not runtime ↔
forge. The row was never accurate, and repairing it must not preserve that error.

**(2) An overclaim beneath it.** The paragraph states _"Every row here is therefore a live
ratchet entry rather than a claim — it fails the suite the day it is repaired."_
`ARCHITECTURE_RATCHET` in `canon/test/architecture.test.ts` holds **import-graph edges
only**. A DRY breach across two packages is not an edge and was never in it. So the
sentence is false for at least this row, and its falsity is precisely why the row could
go stale silently — the doc asserted a guard that did not cover it.

This is the defect class the doc itself names one paragraph earlier: _"A property stated
only in prose is a property that drifts silently."_ It drifted.

## Inputs

- `ARCHITECTURE.md` — the divergence table and the paragraphs following it.
- `packages/canon/test/architecture.test.ts` — `ARCHITECTURE_RATCHET` (L90), the
  shrink-only leg (L477), and what the four properties are actually checked against.
- `packages/canon/test/event-vocabulary.test.ts` — the gate that repaired row (1),
  including its own header explaining why the type system could not hold two of three legs.
- `packages/runtime/src/events.ts` — the repaired site, and its header's account of which
  two packages held the duplicate.
- `packages/canon/test/ground-conformance.test.ts` — check whether it pins any of this
  before editing.

## Constraints

- **Read the original warrant before undoing anything.** `ARCHITECTURE.md` states it is
  hand-authored ground: _"never revised to match what the source currently does. Where the
  two disagree, the source is wrong."_ That governs the north star and the properties. It
  does **not** protect the divergence table, whose whole function is to report the source's
  current state — but the distinction must be made explicitly in the commit, not assumed.
- **Recompute every number in the same breath as writing it.** Two rows in this table
  already record quoted-forward counts that were never measured (`~110` that was 75 at the
  commit that wrote it; `154` that was 177). Do not add a third.
- Do not mark a row REPAIRED without naming the commit and the gate that holds it, and
  having run that gate.
- Correcting the overclaim means stating what **actually** holds each row — per row, or by
  kind. Replacing one false general claim with a softer false general claim is not a repair.

## Deps

∅ — wave 0.

## Outputs

- `ARCHITECTURE.md`: the lifecycle-vocabulary row struck and marked repaired, citing
  `2b4a87d0` and `event-vocabulary.test.ts`, with the runtime↔schema correction stated.
- `ARCHITECTURE.md`: the "every row is a live ratchet entry" sentence replaced by an
  accurate account of what holds what — import-graph rows by `ARCHITECTURE_RATCHET`,
  others by their own named gate, and any row held by nothing said to be held by nothing.
- A stated verdict on **every remaining unstruck row**: still live, or also stale. A repair
  that fixes the one row I happened to notice and leaves its siblings unexamined
  reproduces the defect. On finding one stale row, re-verify all of them.

## Accept

1. No row in the divergence table asserts a condition that does not hold at HEAD. Proven
   per row by a command run against the tree, with the command shown.
2. The paragraph following the table is true of the table as it now stands, per row.
3. `pnpm verify` green; `ground-conformance.test.ts` green.
4. The commit distinguishes the divergence table (a report, revisable) from the north star
   and the four properties (ground, not revisable to match source).

**Pre.** Fails today: the lifecycle-vocabulary row reads as live; the ratchet holds import
edges only.
