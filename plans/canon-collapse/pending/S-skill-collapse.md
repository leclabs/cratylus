# S · skill-collapse (per-skill)

**Slice** CORPUS · **Wave** 2 · **Deps** E1 ⊳dep, E2a ⊳dep · **State** pending · **Executor** nico

Parameterized by `<skill> ∈` the 15 skills (`src/skills/*.ts`). Each leaf edits ONLY `src/skills/<skill>.ts` →
file-disjoint → concurrent with organs/agents/hooks.

## Objective

Collapse one `SkillCell` to the MODEL shape (D9): strip fields that restate the type or the filename; reduce the
signifying prose to residue. Leave the procedural `body`/`composition` (content, not σ\*).

## Spec

- Drop the mutually-derivable handles: `trigger` (= `/`+filename), `verb` (usually == name); keep exactly one
  navigable handle (the filename/export). If a skill's `verb` genuinely differs from its name, keep it; else drop.
- `delineation` → **residue-tight σ\*** (the progressive-disclosure one-liner: anchor + only what the anchor
  doesn't fire), not a prose sentence. E2a gates it.
- Drop `formalBlock` when empty.
- **Keep** `body` (the projected procedure — R=LLM content, not a σ\* residue) and `composition` (ESM sibling
  refs). D8 naming holds: file = English handle; a strong foreign anchor (e.g. `weitermachen` in `carry-on`)
  stays in the body's formal notation.

## Acceptance (falsifier)

- FAIL if any field remains that is mechanically derivable from the filename (E2b REDs).
- FAIL if `delineation` is still a free prose sentence (E2a REDs).
- FAIL if `body` semantics changed (skills are behavior — cold-decode the delineation before/after; must match).
- FAIL if this task edits any file outside `src/skills/`.
- FAIL (skill=`praxis` specifically) if the collapse drops the **agent↔agent ρ=LLM codification** in its
  dispatch/judge laws — `reader-reach.test.ts` must stay green (D11).
- FAIL if `pnpm --filter @leclabs/agent-anatomy typecheck` REDs or the skill no longer projects (projection-stability).

## Return

Per-field kept/dropped rationale · the residue `delineation` · projection check · falsifier clearances.
