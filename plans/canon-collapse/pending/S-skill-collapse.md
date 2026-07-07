# S · skill-collapse (per-skill)

**Slice** CORPUS · **Wave** 2 · **Deps** E1 ⊳dep, E2a ⊳dep · **State** pending · **Executor** nico

Parameterized by `<skill> ∈` the 15 skills (`src/skills/*.ts`). Each leaf edits ONLY `src/skills/<skill>.ts` →
file-disjoint → concurrent with organs/agents/hooks.

## Objective

Collapse one `SkillCell` to the MODEL shape (D9): strip fields that restate the type or the filename; reduce the
`delineation` to residue σ\*; collapse the `formalBlock` — the skill's **PRIMARY σ\* payload** — to a `formalize`
artifact. Every skill surface (`delineation` · `formalBlock` · `body`) is a **DEPLOYED artifact the model reads
as context** ⇒ it MUST address the model's semantic space in formal σ\*, **never human prose** (the vision's
failure criterion). Nothing here is "left as content."

## Spec

- Drop the mutually-derivable handles: `trigger` (= `/`+filename), `verb` (usually == name); keep exactly one
  navigable handle (the filename/export). If a skill's `verb` genuinely differs from its name, keep it; else drop.
- `delineation` → **residue-tight σ\*** (the progressive-disclosure one-liner: anchor + only what the anchor
  doesn't fire), not a prose sentence. E2a gates it.
- **`formalBlock` → a `formalize` artifact** (declarations-above / laws-below, **ZERO explanatory prose**):
  every semantic-load gloss / `#`-preamble LIFTED into formal notation, never trimmed to short prose nor merely
  deleted. It is the skill's PRIMARY σ\* payload (13/15 non-empty). **Invoke `/formalize`** — do not re-derive a
  weaker local predicate (invoke-the-canonical). A skill's executable (shell call) is a DECLARED
  function/operation in the block (a signature line, cf. `praxis`'s `live : session → 𝔹`), NEVER exempt bytes;
  raw code survives only in HookCell `command`/`workers` (a different Kind).
- **`body`:** its semantic-load content LIFTS into the `formalBlock`; residual `body` is held to LLM register
  (`reader-density`), NEVER human prose. `composition` (ESM sibling refs) is a code mechanism (cite-don't-copy).
  D8 naming holds: file = English handle; the strong foreign anchor (e.g. `weitermachen` in `carry-on`) stays in
  the formal notation.

## Acceptance (falsifier)

- FAIL if any field remains that is mechanically derivable from the filename (E2b REDs).
- FAIL if `delineation` is still a free prose sentence (E2a REDs).
- FAIL if a non-empty skill's `formalBlock` is dropped, or the `formalBlock` carries explanatory prose rather
  than a declarations-above / laws-below `formalize` artifact (E2a REDs).
- FAIL if ANY deployed skill surface (`delineation` · `formalBlock` · `body`) reads as human prose rather than
  formal σ\* (reader-density / E2a REDs) — the vision's failure criterion.
- FAIL if `body` semantics changed (skills are behavior — cold-decode the delineation before/after; must match).
- FAIL if this task edits any file outside `src/skills/`.
- FAIL (skill=`praxis` specifically) if the collapse drops the **agent↔agent ρ=LLM codification** in its
  dispatch/judge laws — `reader-reach.test.ts` must stay green (D11).
- FAIL if `pnpm --filter @leclabs/agent-anatomy typecheck` REDs or the skill no longer projects (projection-stability).

## Return

Per-field kept/dropped rationale · the residue `delineation` · projection check · falsifier clearances.
