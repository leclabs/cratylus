# M1 · store-ceiling-enforced

**Deps: —.** Wave 0. Emitted by S3 (`plans/close-out/SPEC.md` §Decision 3).

## Intent

Convert the prose stores' byte watermark from an **advisory report** into an **enforced ceiling**,
and recalibrate it from the live corpus so it fires on the store the operator called bloated. This
is the bloat fix. It adds no admission test and takes no judgement about any record's quality —
per SPEC §3a, that judgement is genuinely semantic and stays with the dream agent.

The mechanism is Letta's, lifted directly (`R1 §Q3.1`): a bounded container cannot bloat, and a
bound converts unbounded append into a forced eviction decision without requiring any judgement
about the incoming write.

## Inputs

- `packages/memory/src/audit.ts:69-74` — `STORE_WATERMARK`, its rationale, its calibration
- `packages/memory/src/audit.ts:225-233` — where `pressure` is computed
- `packages/memory/src/dream.ts:31-43` — `appendToHome`, the single landing site for all
  prose-store growth, reached by `applyRoutes` (`dream.ts:204`) and thus by `apply` and `rollover`
- `packages/memory/src/cli.ts:875-930` — `runReplace` / `replaceGuarded`, the depalimpsest
  write path
- `packages/memory/src/cli.ts:1082-1083` — the existing pressure readout
- `packages/memory/src/strategy.ts:430-435` — `consolidationOwed`, the existing consumer
- `plans/close-out/SPEC.md` §Decision 3 — the derivation of the number and the escape clause

## Constraints

- **Recalibrate `STORE_WATERMARK` 16 000 → 8 000.** Derived from the corpus bracket in SPEC §3b(i),
  not chosen: it is the only round value that fires on `nico/PROCEDURAL.md` (15 969 B) and on no
  uncomplained store (largest: `mav/SEMANTIC.md`, 4 379 B). Update the doc comment at
  `audit.ts:69-73` to record that the number is corpus-derived and to name the bracket.
- **Enforce at `appendToHome` (`dream.ts:31`) — one home, one guard.** Do not add a second check in
  `applyRoutes` or in the CLI append path; `appendToHome` is downstream of both.
- **The two write paths take different predicates.** This asymmetry is load-bearing, not an
  oversight:
  ```
  append  (dream.ts:31)   accepts ⇔ bytes(after) ≤ ceiling
  replace (cli.ts:888)    accepts ⇔ bytes(after) ≤ ceiling ∨ bytes(after) < bytes(before)
  ```
  Without the strict-shrink disjunct an over-ceiling store can **never be repaired** — every
  `replace` is refused for still being over — and `nico/PROCEDURAL.md` is over-ceiling the moment
  this lands. The escape is also what makes the change migration-free (SPEC §Migration).
- **The refusal must name the overage in bytes, the ceiling, and the store.** A bare refusal invites
  a retry loop; a refusal carrying the target turns the next act into a distillation with a known
  budget.
- **Refuse, do not truncate.** Truncating a prose store at a byte offset destroys content silently
  and would cut mid-entry. The whole point of the bound is that a human-or-agent judgement is
  forced; performing the eviction mechanically defeats it.
- **No schema change.** `record.ts` is untouched. No new field, no counter, no migration step in
  `strategy.ts:443 migrateIfOwed`.
- **Do not add an admission test.** Not in this shard, not adjacent to it. SPEC §3a refuses one on
  measured evidence (`scanLine` yields 0 markers across the 103 bloated lines).
- Watermark stays injectable — `AuditOptions.watermark` (`audit.ts:208-209`) already exists; the
  enforcement sites must honour the same override so tests need no global mutation.
- `pnpm --filter @leclabs/memory test && pnpm typecheck` green.

## Outputs

- `packages/memory/src/audit.ts` — the constant + its rationale comment
- `packages/memory/src/dream.ts` — the append guard
- `packages/memory/src/cli.ts` — the replace guard + refusal text
- `packages/memory/test/` — the tests below

## Acceptance

Each criterion states its pre-state behaviour. **(1) and (2) fail on the pre-state today.**

1. **The ceiling fires on the live bloat.** `memory audit --name nico` reports `PROCEDURAL.md` over
   the watermark.
   _Pre-state: reports **clean** — 15 969 B against a 16 000 B watermark._ Assert against a
   fixture of the same size rather than the operator's live home, so the test is hermetic; a
   ≥ 8 001 B store must report pressure and a ≤ 8 000 B store must not.
2. **An append that would cross the ceiling is refused, loudly.** `apply` (and `rollover`) landing
   content that would take a store past the ceiling exits **non-zero** with a message naming the
   store, the ceiling, and the overage in bytes. **Assert exit code and message text.**
   _Pre-state: exits 0 and the store grows past the watermark — `appendToHome` has no size check._
3. **An over-ceiling store can still shrink.** `replace` on a store already over the ceiling
   succeeds when the new body is strictly smaller, **even though the result is still over**, and the
   file is written.
   _Pre-state: vacuously passes (no check exists) — so this criterion is a **regression guard on
   (2)**, not a pre-state falsifier. It must be written, because getting it wrong bricks the live
   corpus._
4. **A replace that grows an at-ceiling store is refused.** Same message shape as (2).
5. **`consolidationOwed` fires for an over-ceiling store** — `strategy.ts:434` already reads
   `pressure`, so this must hold without editing that predicate. If it needs an edit, the guard was
   put in the wrong place.
6. **No schema drift:** the diff touches no field of `EpisodicRecord` and adds no migration step.
   Verifiable by `git diff -- packages/memory/src/record.ts` being empty.
7. `pnpm --filter @leclabs/memory test && pnpm typecheck` green.
