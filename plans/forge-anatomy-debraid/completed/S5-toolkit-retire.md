# S5 · TOOLKIT-RETIRE — delete the forked toolkit, rewire to forge's IR

**Objective.** Remove anatomy's forked skill/cell types (the root braid) and rewire every importer to consume
forge's `Skill`/`SkillExpression`/`Agent` IR. After this shard, one model of a skill exists, in agent-forge.

## Ground state (READ FIRST — deliberately-broken checkpoint)

- Branch `tmp-illustrate-conceptual-architecture`. HEAD `00d19f5` intentionally broken; realize the direction,
  don't revert. Green reference = `7fd1c43`. push/deploy **Operator-reserved**.
- This is the retirement wave: it runs only AFTER cells (S2) author `formalBlock`, the adapter (S3) generates
  from it, and the gates (S4) type on forge's IR — so nothing legitimate still needs the forked type.

## Inputs

- `packages/agent-anatomy/src/toolkit/skill-cell.ts` — the forked `SkillCell` interface + `SkillExpression`
  brand (:27, :38). `packages/agent-anatomy/src/toolkit/cell.ts` — `ParsedSkill`, `parseSkill`,
  `firstFenceInterior` (the parse-to-recover machinery). `toolkit/codegen.ts` — inspect: is it live or a
  parallel of forge's projection?
- **Importer census + OWNERSHIP PARTITION (S1 recon; RE-GREP at dispatch, it rots).** By the time S5 runs, the
  skill-side and adapter-side importers are ALREADY flipped to forge's IR by upstream shards; S5 owns only the
  REMAINDER + the deletion:
  - flipped by **S2** — the 15 `skills/*.ts` cells (→ forge `Skill`/`SkillExpression`).
  - flipped by **S3** — `toolkit/project-cli.ts` + `adapters/claude/anatomy.ts`.
  - flipped by **S4** — `cold-oracle/*`.
  - **S5 OWNS (the remainder):** `hooks/praxis-continuity.ts`, `hooks/stance-guardrail.ts`,
    `toolkit/{codegen, project-cli-codex, project-targets, hooks}.ts` — rewire each to forge's IR; then DELETE
    the local defs. The grep also matches `hook-cell`/`rule-cell` — DIFFERENT cells, do not touch.
- `packages/agent-forge/src/anatomy/index.ts` — the surviving IR. S2/S3/S4 completions ⊳dep.

## Constraints (design decisions)

1. **Delete the forked `SkillCell` + `SkillExpression`** from `toolkit/skill-cell.ts`. If a small re-export
   shim (`export type { Skill as SkillCell, SkillExpression } from '<forge>'`) minimizes churn, that is
   acceptable ONLY as a transitional courtesy — the parallel _definition_ must be gone; there must be exactly
   one authored `Skill` type, in forge.
2. **Delete the parse-to-recover path** in `cell.ts` (`firstFenceInterior`/`parseSkill` that recover the
   formalBlock from a stored body) — it exists only to un-stringify the `body` that no longer exists. Retain
   only cell utilities with a live, non-skill consumer (verify by grep).
3. **Rewire every importer** to forge's `anatomy/index.ts` IR. Do not leave a live import of the forked type.
4. `codegen.ts`: if it duplicates forge's projection, retire it; if it has a distinct live purpose, retype it
   onto forge's IR. Decide by tracing its callers.
5. Do NOT touch `hook-cell.ts` / `rule-cell.ts` — different cell kinds, out of scope.
6. **Gate-caller fixup (S4 hand-off).** `packages/agent-anatomy/test/reader-density.test.ts` (~L659-666) still
   drives the residue gate on the OLD cell shape: it calls `admissibleSingleLine(s.description)` and
   `admissibleBody(s.body)`. To land the E2a un-gating end-to-end: DROP the `s.description` residue assertion
   (it is σ_human\*, no longer gated) and switch `admissibleBody(s.body)` → `admissibleFormalBlock(s.formalBlock)`
   (the typed S4 entry point). This test must go green under the new shape.
7. **Composition wiring (S3 hand-off) — ALL 15 cells, or projection crashes.** S3 made `Skill.composition` a
   lazy thunk `() => readonly Skill[]` and `project-cli.ts` now CALLS `cell.composition()`. Every cell still has
   the eager `composition: []`, so `project-cli` will crash at runtime (`[]()` is not a function) until you wire
   thunks. Fix ALL 15 `skills/*.ts`:
   - cells with real siblings (anchor preserved as an inline comment, e.g. `// composition (…): exemplify ·
materialize`): `composition: () => [exemplify, materialize]` — plain ESM `import { exemplify } from
'./exemplify.js'` at top; the thunk defers ACCESS past module load, so the cyclic graph
     (conceptualize↔exemplify↔signify↔materialize, elicit↔probe) resolves via live bindings without TDZ-crash.
   - cells with no siblings: `composition: () => []`.
   - Remove the placeholder comments. Verify `project-cli.ts` RUNS (projects a skill end-to-end) and the
     "Composed from …" lines return.
8. **Codex agent-leak (S3 flag — forge, same class as claude's).** `packages/agent-forge/src/adapters/codex/
anatomy.ts:55` `agentToCodexTomlObject` still maps `emoji + a.persona` → the TOML `description`. Align it to
   the new σ_human* field: `description: a.description` (drop the emoji+persona map), mirroring S3's claude fix.
   `persona` stays σ*. Then **rebuild forge dist** (`pnpm --filter @leclabs/agent-forge build`) — you are the
   sole writer this wave, no race. (This is the ONE forge edit in S5; everything else is anatomy.)

## Dependencies

- S2 (CELLS-MIGRATE) ⊳dep, S3 (ADAPTER-THIN) ⊳dep, S4 (GATES-RETYPE) ⊳dep — all consumers must be off the
  forked type before it is deleted.

## Outputs

- Forked `SkillCell`/`SkillExpression` definitions removed; all importers on forge's IR; parse-to-recover path
  deleted. A return: the final importer census (0 live imports of the forked _definition_), each rewired file,
  and codegen's disposition (retired / retyped) with the caller-trace justifying it.

## Acceptance (falsifier)

- FAIL if `grep -rn 'interface SkillCell\|type SkillExpression' packages/agent-anatomy/src/` matches a
  DEFINITION (not a re-export) — a parallel skill model survived.
- FAIL if any file still imports the forked `SkillCell`/`SkillExpression` as the authored type (a transitional
  re-export shim pointing at forge is the only allowed form).
- FAIL if `firstFenceInterior`/`parseSkill` (the body parse-to-recover) remains with no live consumer.
- FAIL if `hook-cell.ts` or `rule-cell.ts` was deleted/altered (out-of-scope collateral).
- FAIL if the return is human-register prose, not a dense structured census.
