# T4 — skill-cell (ABSORBED into `agent-runtime/S8` · was pending · wave 1 · deps T1)

> **⛔ ABSORBED-BY `agent-runtime/S8` (skills-rewire) — do NOT execute as-is.**
> The `event-tap.ts` cell below is reshaped into a **thin-shim skill** under the `agent-runtime`
> architecture — projected against the runtime port, dispatching to `agent-runtime tap <verb>` rather
> than carrying/declaring an `assets: ['event-tap.sh']` companion. The cell's naming/description/gate
> obligations carry forward into S8; the `assets:`-companion coupling is dropped (see T2). Count-bump
> discipline still applies wherever the shim cell lands. See `plans/agent-runtime/SUPERSESSION.md`.
> Historical spec follows.

---

## Objective

Author `packages/agent-canon/src/skills/event-tap.ts` — the `Skill` cell — so it passes the full
skill gate-set, and reconcile the hardcoded skill-count gates.

## Dep-fed inputs

- **T1** (`content(t1-derive-verbs)`) — the settled verb set the formalBlock names.

## Static inputs (pinned)

- `.scratchpad/tap-skill-draft.md` (§1) — the proposed `name/description/formalBlock/composition`.
- `packages/agent-canon/src/skills/handoff.ts` — `Skill` shape exemplar (`formalBlock` `as SkillExpression`, `composition: () => [...]`).
- `packages/agent-forge/src/anatomy/index.ts` (L282-296) — the `Skill` type; `assets?: readonly string[]` (declare `assets: ['event-tap.sh']` here, made live by T2).
- `packages/agent-canon/test/skill-shape.test.ts` (L99 `expect(skills.length).toBe(15)`) — OPERATIVE gate + hardcoded count.
- `packages/agent-canon/test/symbols.test.ts` (L205 `.toBe(15)`; `declaredGlyphs` ← `src/toolkit/operator-lexicon.ts`) — SYMBOLS gate + hardcoded count.
- `packages/agent-canon/test/reader-density.test.ts` — description σ_human\* register + `formalBlock` RESIDUE (`admissibleFormalBlock`).
- `packages/agent-canon/test/cratylism.test.ts`, `packages/agent-canon/test/formal-block-self-sufficiency.test.ts`.

## Constraints

- **HOT-DIR SEQUENCING:** `src/skills/` + `test/` are edited by a live sibling. **Finalize this cell
  and the count-bumps only after the sibling settles** (verify: `git status` shows the sibling's
  `create-skill.ts`/test edits committed or gone). Author the cell content anytime; land it late.
- **Count-bump reads the LIVE count**, never assumes 16 — `skills.length` after adding event-tap =
  (globbed count); the sibling may add a skill. Bump `skill-shape.test.ts` + `symbols.test.ts` to the
  actual number.
- `description` = **σ_human\*** (router selection line — reconstruction-grade, no hedge/2nd-person).
  `formalBlock` = **σ\*** (formal set-builder, DECLARATIONS/LAWS, no explanatory prose, self-sufficient:
  every term in-cell, only live siblings named — `composition: () => []`, standalone).
- Any new glyph → **declare it in `operator-lexicon.ts` (cold-verified)**, never downgrade the sign to
  pass SYMBOLS (`gate-appeasement` is forbidden).
- Filename `event-tap.ts`, `name: 'event-tap'` (cratylism structural).

## Outputs

- `src/skills/event-tap.ts` + the reconciled count-bumps + any lexicon declaration.

## Accept (blind falsifier)

REJECTED if: `pnpm --filter @leclabs/agent-canon test` is red on any skill gate; OR `tsc`/`biome` red;
OR a skill-count is hardcoded to a stale number; OR a glyph was downgraded rather than declared; OR
the `description` reads in human register; OR the cell was landed into `src/skills/` while the sibling
dir was still dirty. ACCEPTED when: test + tsc + biome green with event-tap in the suite at the live
count, `project` emits `skills/event-tap/SKILL.md`, and the landing happened on a settled dir.
