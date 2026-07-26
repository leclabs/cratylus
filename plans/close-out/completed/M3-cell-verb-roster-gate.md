# M3 · cell-verb-roster-gate

**Deps: —.** Wave 0. Emitted by S3 (`plans/close-out/SPEC.md` §Decision 5, clunk A).

## Intent

Close the **third, ungated home** of the memory verb roster. The set of memory verbs is enumerated
in three places; two are pinned against each other and the third — the skill cells' invocation
strings — drifts silently. Gate it, so a verb renamed or retired in code cannot leave a cell
instructing an agent to invoke something that no longer exists.

This is the smaller thing. Collapsing the three homes into one generated source is a redesign of
the seam and is **out of contract** (SPEC §Decision 5); refusing drift buys the same protection at
a fraction of the change.

## Inputs

- `packages/agent-memory/src/verb-port.ts:31-54` — `MEMORY_VERBS`, and the comment that documents
  this exact failure class: _"they diverge SILENTLY: a verb present in `cli.ts` but missing here
  typechecks, passes every unit test, and is simply unreachable through the runtime — which is how
  `get` and `rollover` shipped dead"_
- `packages/agent-memory/test/verb-roster.test.ts` — the existing two-home gate, and the model for
  this one
- The ungated third home:
  - `packages/agent-canon/src/skills/dream/skill.ts:14,18-25,27` — `lock`, `read`, `fold`, `drain`,
    `apply`, `get`, `rollover`, `audit`, `replace`
  - `packages/agent-canon/src/skills/wake/skill.ts:14,19` — `session begin`, `encode`
  - `packages/agent-canon/src/skills/handoff/skill.ts:10` — `session release`
- `packages/agent-canon/src/toolkit/` — where the sibling gates live
  (`formal-block-self-sufficiency.ts`, `symbol-probe-gate.ts`) and the shape to follow
- V2 (`plans/close-out/completed/V2-residue-validation.md`) — the same divergence class one layer
  down: one verb's contract stated three different ways in three files

## Constraints

- **The gate REFUSES; it never authors.** `AGENTS.md` fixes the direction — source is brought _up_
  to the grounding, never regenerated _from_ it — and the cells are hand-authored formal blocks
  under the self-sufficiency and symbols gates. Generating cell text from `MEMORY_VERBS` inverts
  that and is forbidden.
- **Direction of the check: cell → code.** A cell naming a verb absent from `MEMORY_VERBS` **fails**.
  The converse is **not** an error: a verb existing in code that no cell invokes is normal (most of
  `MEMORY_VERBS` is not cell-facing — `init`, `node`, `home`, `migrate`, `session`). Asserting set
  equality here would be wrong and would fail on day one.
- **Extract the verb from the invocation string, do not hand-list it.** The cells write
  `` `scripts/memory.mjs <verb> …` `` — parse the token after the script path. A hand-maintained
  list inside the gate would be a _fourth_ home for the same set, reproducing the defect the gate
  exists to close.
- **Sub-verbs must not produce false failures.** `session begin` / `session release` are
  `<verb> <subcommand>`; the gate checks the head token (`session`) against `MEMORY_VERBS`.
- **Do not edit the cells in this shard.** M2 owns `dream/skill.ts`. This shard delivers the gate
  and it must pass against the cells **as they stand today** — if it does not, the gate is wrong,
  not the cells.
- **Dependency direction — measured, so decide it here rather than in the edit.** Neither package
  depends on the other today: `agent-memory` deps are `{@leclabs/agent-runtime}`, `agent-canon` deps
  are `{@leclabs/agent-forge}`. So the gate **lives in `agent-memory/test/`**, where `MEMORY_VERBS`
  is a local import, and reaches the cells by adding `@leclabs/agent-canon` as a **devDependency**
  of `agent-memory` — a dev-only edge that leaves the shipped dependency graph unchanged and does
  **not** make canon depend on memory. If that edge is unacceptable for a reason this shard did not
  foresee, the fallback is reading the cell source files by path from the same test; **a duplicated
  roster is not a fallback**.
- `pnpm test && pnpm typecheck` green.

## Outputs

- The gate + its negative controls — a test under `packages/agent-memory/test/`
- `packages/agent-memory/package.json` — the `@leclabs/agent-canon` devDependency edge

## Acceptance

1. **The gate passes against the corpus as it stands today.** Every verb named in `dream`, `wake`,
   and `handoff` resolves to a member of `MEMORY_VERBS`. A green run here proves the gate is
   correctly parsing, not vacuously passing — see (3).
2. **The negative control fires.** A fixture cell (or a temporary in-test mutation) invoking
   `scripts/memory.mjs consolidate …` — a plausible verb that does not exist — **fails the gate**,
   naming the cell, the offending verb, and the roster it was checked against.
   _This is the pre-state falsifier: today such a cell passes every gate and every test in the
   repo, and ships an agent an instruction to invoke a nonexistent verb._
3. **The gate is not vacuous.** Removing a real verb from `MEMORY_VERBS` (in-test) makes the
   corpus run **fail**. Without this control, a parser that silently extracts zero verbs would
   report green forever — the `apparatus-under-zero-trust` failure: _"no block ever fired" means it
   is DARK_.
4. **Sub-verbs pass:** `session begin` and `session release` do not fail against a roster
   containing `session` but not `session begin`.
5. **The converse is not asserted:** a verb in `MEMORY_VERBS` invoked by no cell does not fail.
   Demonstrate with `init` or `node`, which no cell invokes today.
6. `pnpm test && pnpm typecheck` green.
