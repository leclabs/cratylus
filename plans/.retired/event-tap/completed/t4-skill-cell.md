# T4 — skill-cell (ABSORBED into `runtime/S8` · was pending · wave 1 · deps T1)

> **⛔ ABSORBED-BY `runtime/S8` (skills-rewire) — do NOT execute as-is.**
> The `event-tap.ts` cell below is reshaped into a **thin-shim skill** under the `runtime`
> architecture — projected against the runtime port, dispatching to `cratylus-run tap <verb>` rather
> than carrying/declaring an `assets: ['event-tap.sh']` companion. The cell's naming/description/gate
> obligations carry forward into S8; the `assets:`-companion coupling is dropped (see T2). Count-bump
> discipline still applies wherever the shim cell lands. See `plans/runtime/SUPERSESSION.md`.
> Historical spec follows.

---

## Objective

Author `packages/canon/src/skills/event-tap.ts` — the `Skill` cell — so it passes the full
skill gate-set, and reconcile the hardcoded skill-count gates.

## Dep-fed inputs

- **T1** (`content(t1-derive-verbs)`) — the settled verb set the formalBlock names.

## Static inputs (pinned)

- `.scratchpad/tap-skill-draft.md` (§1) — the proposed `name/description/formalBlock/composition`.
- `packages/canon/src/skills/handoff.ts` — `Skill` shape exemplar (`formalBlock` `as SkillExpression`, `composition: () => [...]`).
- `packages/forge/src/anatomy/index.ts` (L282-296) — the `Skill` type; `assets?: readonly string[]` (declare `assets: ['event-tap.sh']` here, made live by T2).
- `packages/canon/test/skill-shape.test.ts` (L99 `expect(skills.length).toBe(15)`) — OPERATIVE gate + hardcoded count.
- `packages/canon/test/symbols.test.ts` (L205 `.toBe(15)`; `declaredGlyphs` ← `src/toolkit/operator-lexicon.ts`) — SYMBOLS gate + hardcoded count.
- `packages/canon/test/reader-density.test.ts` — description σ_human\* register + `formalBlock` RESIDUE (`admissibleFormalBlock`).
- `packages/canon/test/cratylism.test.ts`, `packages/canon/test/formal-block-self-sufficiency.test.ts`.

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

REJECTED if: `pnpm --filter @leclabs/canon test` is red on any skill gate; OR `tsc`/`biome` red;
OR a skill-count is hardcoded to a stale number; OR a glyph was downgraded rather than declared; OR
the `description` reads in human register; OR the cell was landed into `src/skills/` while the sibling
dir was still dirty. ACCEPTED when: test + tsc + biome green with event-tap in the suite at the live
count, `project` emits `skills/event-tap/SKILL.md`, and the landing happened on a settled dir.

---

**DISPOSITION (mav, 2026-07-26) — EXECUTED, after a FALSE supersession nearly buried it.**

`SUPERSESSION.md:32` recorded this shard as absorbed into `runtime`/S8. **That claim was
false against the code.** S8 is memory-only — its objective is rewiring memory-touching skills
and its own falsifier greps for `memory ` in `src/skills/`. Event-tap appears nowhere in it.
So the shard was marked absorbed, the plan retired as complete, and the work vanished with
nobody deciding to drop it.

Consequence, live until today: the capability was fully built, fully tested, and **unreachable
by any agent** — inverting the point of the whole chain.

Recovered as `close-out`/V10 and executed. It also surfaced a defect the cell alone would have
hidden: the shim emitter is `f(capability)`, so an `eventTap` cell emits a shim spawning
`cratylus-run eventTap`, and `main.ts` routed only the literal `tap`. Writing the cell without
that fix would have shipped a **dead shim**, green on projection.

**The lesson this shard is the evidence for: a supersession claim is a CLAIM.** Check the
absorbing shard's falsifier actually covers the absorbed work before retiring on it.
