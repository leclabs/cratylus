# C1 · delete-cruft + global exit gate ⚡ TERMINAL

**Slice** CLEANUP · **Wave** 3 · **Deps** A1..A11 ⊳dep, O1..O23 ⊳dep · **State** pending · **Executor** nico

## Objective

Delete the cruft the collapse orphaned (once `grep` proves zero live references) and clear the whole-repo exit
gate. Partition-then-prune; grep for CODE path-deps, not just prose.

## Spec — delete, each only after a zero-reference grep

- `src/agents/base.ts` + `src/toolkit/make-base.ts` (genus floor retired — memory/persona ride their organs, D6);
  confirm the projector no longer references either.
- The **9 provenance fragment files, ENUMERATED** (B5 — a `*-archetype-*` glob catches only 8):
  `arch-doc-writer-archetype-pink` · `boswell-archetype-yellow` · `developer-archetype-blue` ·
  `diagnostic-delegate-cyan` · `investigator-archetype-purple` · `mav-archetype-green` ·
  `planner-archetype-blue` · `reviewer-archetype-purple` · `tester-archetype-purple` (all under
  `src/organs/provenance/`).
- Any residual `Provenance` fragment-kind references in the corpus.
- **The entire persona value-cell catalog** `src/organs/persona/*.ts` (D13 — persona is now a plain-string
  description on the agent, not a fragment); archive `src/organs/persona/README.md` per D12. Remove the `Persona`
  fragment type from the anatomy.
- (Note: `src/standing/` is already absent in the tree — verify, no-op if gone. m3.)
- **`project-human` — DEFER, don't retire (D11 corrected + D12).** The 24 `organs/**/README.md` are stale
  (they project the pre-collapse definiens): **archive** each to `.scratchpad/{organ}-README.{ulid}.md` with its
  original path appended (D12), don't delete. **KEEP** the `project-human*.ts` toolkit — it regenerates the human
  view once the source settles. **Suspend** the byte-lock until then: empty `organ-docs.ts` `PROJECTED_ORGANS`
  (or skip `test/projection-boundary.test.ts`) so the gate doesn't demand READMEs that are intentionally parked.
  On-demand agent explanation covers the interim; regeneration is a post-settle follow-up, not this plan.

## Acceptance (falsifier / global exit gate)

- FAIL if any deleted file is still imported anywhere (`grep -rn` + a dir-walk that errors LOUDLY on a missing
  path, never swallows it).
- FAIL if `E2b` (structural-parsimony) is not GREEN post-deletion (it RED'd on this cruft at wave 0).
- FAIL if the **whole-repo** exit gate is not green on a **clean worktree of the landing commit**:
  `pnpm -w build && test && lint && typecheck` + `E2a` + `E2b`.
- FAIL if any agent's projected SOUL is missing its mark (emoji+hue) or protocol sections — proving projection
  survived the `base.ts`/fragment deletion via the adapter, not the deleted source.

## Return

Deleted paths · the zero-reference grep proof · the full green whole-repo exit-gate transcript on a clean
worktree · one projected SOUL showing mark+protocol survived.
