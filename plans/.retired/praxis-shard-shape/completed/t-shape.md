# T-shape — formalize the shard-document shape into the praxis formalBlock

## Objective

Make the praxis **formalBlock** (σ\*) carry the shard-document shape at full fidelity, so a reader of the
payload alone produces the 6-field shard (objective · inputs · constraints · dependencies · outputs ·
acceptance-with-falsifier) rather than the terser `spec = ⟨static, scope, accept⟩` 3-tuple. Reconcile the
3-tuple and the 6 fields into ONE consistent model.

## Static inputs

- `packages/canon/src/skills/praxis/skill.ts` — formalBlock L11 `spec : P → ⟨static, scope, accept⟩`,
  L14 `accept`, L15 `census : intent → ⟨scope, static, deps⟩`, L62 `∀ t : ∃ r : ¬accept(t)(r)`
  (the falsifier law); description L107 (the 6-field template, the shape to lift).
- `packages/canon/src/skills/create-skill/skill.ts` — the formal-block law: `block ≜ … no prose,
σ* density`; `self-sufficient(block) ⇔ every term defined in-cell`.
- `packages/canon/src/skills/formalize/skill.ts` — the prose→formal discipline this act follows.
- `packages/canon/test/projection-stability.test.ts` and any praxis-referencing test.

## Constraints

- **Reconcile, do not duplicate.** The existing `spec = ⟨static, scope, accept⟩` and the 6-field template
  must become one model — either `scope` is formally refined into its parts (objective · constraints ·
  outputs) so `spec` enumerates all six, or the shard-shape is signified as its own structure that `spec`
  references. The block must not now carry two different shard shapes.
- **Falsifier stays first-class.** The `∃ r : ¬accept(t)(r)` law already mandates a falsifiable
  acceptance; the lifted `acceptance` field must bind to it, not restate it — a shard's acceptance IS the
  falsifier-bearing `accept`.
- **σ\* density, no prose.** The formal-block law forbids comments/prose in the block; the shape is
  signified in notation, self-sufficient (every term defined in-cell). This is where a naive lift fails —
  do not paste the description's English list into the block.
- **Description stays the selector.** The one-line `description` remains σ_human\* (unchanged or trimmed);
  the block becomes the authoritative shard-shape source. Do not delete the shape from the description if
  it still reads as a faithful one-line summary — but the block, not the description, must now carry the
  fidelity.
- Signification act: cold-verify the new block against the isolated oracle.

## Dependencies

None. Independent of `autonomy-decomplect` (a different skill).

## Outputs

- `praxis/skill.ts` formalBlock refined so the shard-document shape (6 fields, acceptance bound to the
  falsifier law) is carried in σ\*, reconciled with `spec`.
- `SKILL.md` re-projects; suite + typecheck + SYMBOLS/formal-block gates green.
- A cold-decode transcript of the new formalBlock.

## Acceptance

- A cold reader given **only** the praxis formalBlock (not the description) reconstructs the 6-field
  shard-document shape, with acceptance identified as the falsifier-bearing `accept`.
- `pnpm --filter @leclabs/canon test` + `typecheck` green; the formal-block self-sufficiency and
  SYMBOLS gates pass (no undeclared glyph, no prose in the block); `pnpm canon:project` clean.
- **Falsifier:** the cold reader of the block alone yields only the 3-tuple or cannot name the six
  fields; OR the block gains prose/comments; OR the block and description now specify _different_ shard
  shapes (divergence); OR a new glyph is undeclared. Any of these fails the shard.
