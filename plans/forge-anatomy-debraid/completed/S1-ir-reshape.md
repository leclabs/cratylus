# S1 · IR-RESHAPE — the single type home

**Objective.** In agent-forge's IR, reshape `Skill` to the target cell shape and add the `SkillExpression`
brand + `Agent.description`, so every downstream consumer (anatomy cells, the adapter, the gates) has ONE
home to consume. This is the foundation wave — S2/S3/S4 all depend on it.

## Ground state (READ FIRST — this is a deliberately-broken checkpoint)

- Branch `tmp-illustrate-conceptual-architecture`. HEAD `00d19f5` is **intentionally broken** (a partial
  Operator find-replace, `TS1117` dup-property across skill cells). **Red is EXPECTED. Realize the direction —
  do NOT revert toward the old shape.** Last fully-green commit = `7fd1c43` (rollback base only, not a target).
- This shard reshapes TYPES. Downstream files (`adapters/claude/anatomy.ts`, `toolkit/project-cli.ts`) will go
  redder once `Skill.body` is gone — **that is expected and is S2/S3's job, not yours.** Do NOT add a `body`
  back to satisfy them. Your bar is the type file itself (see Acceptance), NOT whole-package green (that is S6).
- push/deploy is **Operator-reserved** — never push, never deploy. Commit locally only if instructed.

## Inputs

- `packages/agent-forge/src/anatomy/index.ts` — the IR home. `Skill` (:254, extends `SkillDeploy` :239),
  `Agent` (:197), the brand model `OrganValue<O> = string & { readonly __organ?: O }` (:88).
- `packages/agent-anatomy/src/skills/carry-on.ts` — the Operator's exemplar; shows a `SkillExpression`-typed
  payload const (`carryOnNotation`) + a σ_human\* `description` prose line. **NOTE the exemplar still carries a
  `body` field — that is WIP scaffolding to be dropped (design decision below), NOT the target.**

## Constraints (design decisions — bake these in)

1. **`SkillExpression` brand, parity with `OrganValue`:**
   `export type SkillExpression = string & { readonly __skillExpr?: true };`
2. **`Skill` reshape** — the target cell shape is `{ name · description · formalBlock · composition }` (still
   `extends SkillDeploy`):
   - **DROP `body: string`** entirely. `body` is a projection artifact = `f(name, formalBlock)`; storing it is
     the parse-to-recover / DRY anti-pattern this whole de-braid exists to kill. The adapter GENERATES the
     SKILL.md (S3), the cell never stores it.
   - **ADD `readonly formalBlock: SkillExpression;`** — the sole σ* payload (the self-sufficient set-builder
     block). This is the σ* (model-read) field.
   - **KEEP `readonly description: string;`** — but its doc comment must state it is **σ_human\*** (the
     human-read, selection-line field the router surfaces; NOT residue-gated, NOT σ\*).
   - **KEEP** `name`, `composition`, and the `SkillDeploy` extension unchanged.
3. **`Agent.description`** — add `readonly description: string;` to the `Agent` interface, doc-commented as
   **σ_human\*** (→ SOUL frontmatter `description:` the subagent-router reads). `persona` stays σ\* (→ SOUL body).
   This is the one-level-up twin of the skill bug; S3 wires the projection, you just add the field.
4. Update the interface doc-comments to state the **per-field** reader binding explicitly: σ* = `formalBlock`
   (skill) / `persona` (agent); σ_human* = `description` (both). Do not describe binding at file/cell altitude.

## Dependencies

None — this is wave 0.

## Outputs

- Edited `packages/agent-forge/src/anatomy/index.ts`: `SkillExpression` brand added; `Skill` has `formalBlock:
SkillExpression`, no `body`; `Agent` has `description: string`; per-field binding documented.
- A return listing: the new `Skill`/`Agent` field sets, the brand definition line, and every downstream file
  that now type-errors because of the reshape (a census for S2/S3, not for you to fix).

## Acceptance (falsifier — blind, from the return + the file)

- FAIL if `grep -n 'readonly body' packages/agent-forge/src/anatomy/index.ts` matches inside the `Skill`
  interface (body not dropped).
- FAIL if `SkillExpression` is absent, or is not the `string & { … }` brand form (parity with `OrganValue`).
- FAIL if the `Skill` interface lacks `formalBlock: SkillExpression`, or `Agent` lacks `description: string`.
- FAIL if `npx tsc --noEmit` reports an error **originating inside `anatomy/index.ts` itself** (errors in
  OTHER files from the reshape are expected and must be listed, not silenced).
- FAIL if the return is human-register prose rather than a dense structured census.
