# M2 · dream-cell-pressure-seam

**Deps: M1, M3.** Wave 1. Emitted by S3 (`plans/close-out/SPEC.md` §Decision 5, clunk B).

## Intent

Make the dream cell able to **see the measurement the tool already takes**. `auditHome` computes
store `pressure`; `pressure` is the only trigger `depalimpsest` has; and the cell declares neither.
It declares `gate : home → findings` — omitting `pressure` from the codomain — and then schedules
`depalimpsest` as `periodic`, an unbound schedule standing where a real trigger exists.

**This is why a bound that already existed never produced a consolidation.** The tool measured, the
cell could not read the measurement, and the store grew to 15 969 bytes reporting clean.

M1 makes the bound real and enforced; this shard makes the cell state the law M1 enforces, so the
agent meets a refusal it was told to expect rather than one it must discover.

## Inputs

- `packages/agent-canon/src/skills/dream/skill.ts:25` — `gate : home → findings ⟨dream's exit
condition⟩`, the wrong codomain
- `packages/agent-canon/src/skills/dream/skill.ts:47` — `periodic : SEMANTIC ──depalimpsest──→ …`,
  the unbound schedule
- `packages/agent-canon/src/skills/dream/skill.ts:27` — `depalimpsest`, and its `replace` invocation
- `packages/agent-memory/src/audit.ts:46-52` — `StorePressure`, and its doc: _"This is the quantity
  the machinery was blind to… `depalimpsest` had no fireable trigger because nothing measured size"_
- `packages/agent-memory/src/audit.ts:55-66` — `AuditReport`, the full codomain the cell must reflect
- `packages/agent-memory/src/strategy.ts:419-435` — `consolidationOwed` and its three causes
- **M1's landed guard** — the exact refusal text and the two write-path predicates the cell must
  state
- `plans/close-out/SPEC.md` §Decision 5 and §Decision 3b

## Constraints

- **Three edits to the cell, no more:**
  1. `gate`'s codomain carries `pressure` alongside `findings`.
  2. `periodic` is replaced by the **pressure trigger** — `depalimpsest` fires when a store is over
     its ceiling, not on an unstated schedule.
  3. The **ceiling law** is declared, including the asymmetry M1 implements: append refuses at the
     ceiling, `replace` additionally accepts any strict shrink. An agent that does not know the
     shrink escape exists will read a refusal as a dead end.
- **State the eviction as the agent's judgement.** _That_ an eviction is owed is mechanical; _what_
  to evict is not. The cell must not acquire a mechanical admission predicate — SPEC §3a refuses one
  on measured evidence (`scanLine` yields 0 markers across the 103 bloated lines), and adding one
  here would smuggle it in through the cell.
- **Do not touch the routing laws** (`skill.ts:36-42`). They are V3's landed output and Decision 4
  found them correct — `projection-carries(i) ⇒ drop` and `promotion-is-move` are the right laws for
  the restatement defect. This shard adds the pressure/ceiling seam only.
- **`promotion-is-move` may be sharpened, not replaced.** SPEC §4b found it stated as a _definition_
  where an _obligation discharged at the moment of promotion_ is meant. Tightening that wording is
  in scope; inventing a dedup mechanism is not (SPEC §Decision 4 refuses one on measurement).
- **No new verb.** If the cell would need one, the shard is wrong — say so and stop. M3's gate will
  catch it regardless.
- The cell is a formal block under the **self-sufficiency, symbols, and reader-density** gates.
  Every symbol introduced (`pressure`, `ceiling`) must be declared above the laws, in the
  declarations region, per the composer conventions.
- **M3's gate must be green before and after.** It exists precisely to judge this edit.
- `pnpm --filter @leclabs/agent-canon test` after editing, per V3's constraint.

## Outputs

- `packages/agent-canon/src/skills/dream/skill.ts`
- Whatever canon test/fixture updates the cell edit forces

## Acceptance

1. **The cell declares `pressure`.** `gate`'s codomain names it, and it is a declared symbol in the
   declarations region.
   \*Pre-state: `skill.ts:25` reads `gate : home → findings` — `pressure` appears nowhere in the
   cell. **Fails today.\*** Assert by grep for the symbol in the formal block.
2. **`depalimpsest` has a trigger, not a schedule.** The literal `periodic` at `skill.ts:47` is
   gone, replaced by a predicate over store pressure.
   \*Pre-state: `periodic :` is present. **Fails today.\***
3. **The ceiling law is stated with its asymmetry.** The cell says an append refuses at the ceiling
   **and** that a strict shrink is always accepted. A reader given only the first half would treat
   an over-ceiling store as unrepairable.
   \*Pre-state: no ceiling law of any kind in the cell. **Fails today.\***
4. **No mechanical admission predicate was added.** The cell contains no test that decides
   admission from the _form_ of a record's text. Reviewable by reading the added laws; the
   falsifier is a predicate over `text(i)` appearing in an admission position.
5. **Routing laws unchanged:** `git diff` shows `skill.ts:36-42` untouched apart from any
   `promotion-is-move` sharpening explicitly permitted above.
6. **M3's gate passes on the edited cell**, and the canon suite is green:
   `pnpm --filter @leclabs/agent-canon test`.
7. **Worked example, in the shard's return:** a store at 7 900 B receiving a 300 B append — trace
   what the cell now tells the agent to do, and confirm it matches what M1's code actually does.
   A divergence here means the seam is still open, in the other direction.
