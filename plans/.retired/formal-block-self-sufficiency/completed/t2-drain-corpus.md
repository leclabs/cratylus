# t2 — drain the corpus to self-sufficiency

## Objective

Drive every skill `formalBlock` to pass the t1 gate: for each flagged `--` law/def annotation, apply the
fork — **delete** if redundant (reconstructable from other notation in the block), **formalize** into a
symbol/law then delete if load-bearing — until zero violations remain corpus-wide and the t1 allow-list is ∅.

## Inputs

- `[dep-fed] t1` — the completed gate + its drain worklist (the authoritative per-file violation list).
- `packages/canon/src/skills/*.ts` — the 15 formal blocks. Already drained (SKIP): signify.ts
  σ\*-cluster, probe.ts experiment/coverage. In-scope: signify.ts ρ-region (L47–66) + all other blocks.
- `packages/canon/src/skills/formalize.ts` — the round-trip-equivalent-or-better accept-gate every
  drain move must satisfy.

## Constraints

- Every move is round-trip **equivalent-or-better**: a `delete` removes only content already carried by
  notation; a `formalize` adds notation that reconstructs the deleted comment's full distinction-load —
  no meaning lost.
- Use only **established** signifiers when formalizing (cratylism: cold-verify the sign; no minted
  empty-prior glyphs — as nico used `∘` from operator-lexicon, not a fresh `⊕`).
- A drain that requires a genuine **naming/notation** decision (not mechanical) → STOP, route that block to
  nico; do not ship a dubious canon sign.
- Fan out per-file for concurrency; each file is an independent drain.

## Dependencies

t1 (needs the gate + worklist; drained files must PASS the gate).

## Outputs

- All 15 `formalBlock`s pass the t1 gate; allow-list removed (∅).
- `pnpm --filter @leclabs/canon test` green; `graphify update .` run.

## Acceptance (blind, falsifiable)

1. t1 gate reports **zero** law/def annotations across all skill formal blocks, no allow-list.
2. `pnpm --filter @leclabs/canon typecheck && test` green (incl. symbols.test.ts).
3. For each formalized comment, the added notation reconstructs the removed content (round-trip check in the
   task return). (Falsifier: a distinction present before the drain is absent after ⇒ meaning lost ⇒ reject.)
4. No minted empty-prior signifier introduced. (Falsifier: a new glyph with no established prior ⇒ reject.)
