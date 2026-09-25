# Hypothesis — the canon conflates a commit with an acceptance, so orchestrators withhold commits

Status: **UNVERIFIED.** Written 2026-09-25 from a read-only investigation in
`~/workspaces/cinematiclab`. The session that picks this up verifies or rectifies it, then makes
the change. **Prefer removal to addition**: most of the defect is a definition that should not
exist.

## The observed failure

An orchestrator (`mav`, running `skill://deliver`) dispatched a clean-cutover unit
(`w1-the-face-is-total`, 77 paths) to parallel implementer lanes in a git worktree. Its dispatch
prompts withheld the commit until acceptance. They are verbatim in
`~/.omp/agent/sessions/-workspaces-cinematiclab/2026-09-25T04-54-22-527Z_01a0d6ea-1e3f-72ad-a4dd-0c8e20d831ee.jsonl`,
at JSONL lines 277, 336 and 458:

- "Test lanes do NOT commit. FaceCore commits the whole unit on the branch once everything is green."
- "You are now the CORE OWNER … and the integrator who commits." The commit comes only after all
  suites, parity, typecheck, build, census, formatter and `verify_plan.py` pass.
- "If you near the budget, commit nothing half-verified … then ONE commit on the branch."

Consequences: implementers repeatedly ran out of request budget before "everything" ("Two
previous implementers ran out of request budget", line 336). Their work travelled between agents
as a patch file (`.praxis/canvas/evidence/w1-the-face-is-total.wip.patch`). The branch
`canvas/w1-face-is-total` reached 92 modified and 11 untracked paths with **zero commits** and
fell three commits behind `main`.

The target repo already had the right rule, "COMMIT AT EVERY NATURAL BOUNDARY … binds every
agent that can write" (cinematiclab `CLAUDE.md`). The orchestrator wrote the prohibition
anyway. That repo has since patched its own copy (cinematiclab commit `9a80d1f`, "a commit is
durability, never acceptance"). That patch is local to one repo and does not touch the cause
below.

No agent file, skill or rule in either repo says "do not commit". The prohibition was
**derived** by the orchestrator. The hypothesis names what it was derived from.

## The hypothesis

**H.** The canon models a VCS commit as the _carrier of an acceptance_. An orchestrator that
reasons in that vocabulary reads `¬conform ⇒ ¬accept` as `¬conform ⇒ ¬commit`. It therefore
writes dispatches that hold the commit until the unit is green and accepted. Nothing in the
projected implementer gives the lane a standing commit duty that such a dispatch would have to
override. And the one rule that does grant it, commit-autonomously-at-natural-boundaries, is
scoped to cratylus's own `AGENTS.md` and never projected to the agents that work elsewhere.

### H1 — the conflation (primary cause)

- `packages/canon/src/skills/design/skill.ts:39-41`:
  `commit ≜ a VCS commit ⟨the append-only carrier · attribution ∧ order⟩`,
  `amends : commit × C → 𝔹`, and
  **`accepts : commit → 𝔹 ⟨the commit carries an acceptance @ deliver⟩`**.
- `packages/canon/src/skills/deliver/skill.ts:78-81` imports `commit @ design` and
  `accepts @ design`, then states `∀ unit, r : ¬conform(r) ⇒ ¬accept(unit)(r)`.
- `deliver/skill.ts:121-123`: "the amendment and the acceptance motivating it are **two commits**".

Under these definitions, a commit is where acceptance is recorded, and no commit is a legitimate
place for unaccepted work. "Commit nothing half-verified" follows from them directly.

### H2 — the executor has no commit duty of its own (enabling condition)

- `packages/canon/src/agents/implementer.ts:16` (archetype): "the spec names the files, the
  change and the criteria, and **that is the whole of the mandate**". It also treats exceeding
  the spec as a failure.
- `packages/canon/src/roles/implementer.ts:23-26`: "carries no workflow skill by design … this
  position's decisions were made for it"; `:54-57`: `satisfice` because "this position builds to
  the contract and stops".

So whatever the dispatch says about committing is final for the lane. Committing when the
dispatch forbids it would read as exceeding the mandate.

### H3 — the correct rule exists but is not projected (missing carrier)

- `packages/canon/src/rules/repo-preamble.ts:25, 42-43`: "Commit autonomously at natural
  boundaries … overrides the generic harness default ('commit only when the user asks')". Its
  `targetPath` is `AGENTS.md` with `scope: ''`, so it reaches **cratylus's own workspace only**.
  Agents projected to `~/.claude/agents/` and `~/.omp/agent/agents/` carry no equivalent
  dimension. [INFERENCE: verify by grepping the projected agent files for `commit`. On
  2026-09-25 that grep found none.]

### H4 — a harness collision the canon cannot remove (constraint, not cause)

The omp built-in `task` tool description, compiled into omp and absent from every config or
extension on this machine, says "Shared edits need one integration owner" and "Every task MUST
skip build/lint/tests/formatters mid-flight; run once afterward." The first sentence produces the
single integrator. The second forbids the formatter that a repo's pre-commit hook demands before
any commit, so a compliant lane cannot make a commit that passes the hook until the end. The
rule's intent is sound: whole-tree formatters rewrite sibling lanes' files. **Recommendation:**
leave omp alone and carve the exception in the projected commit rule (see R2). Formatting your
own paths, by pathspec, immediately before your own commit is part of the commit, not a
mid-flight lint.

### Candidates checked and ruled out

- `dimensions/objective/delivery.ts:3`, `delivery ⟨end-to-end integrated green⟩`, names only
  the terminal milestone, but it says nothing about commits. It is consistent with H1 and not a
  cause on its own. Leave it.
- `hooks/stance-guardrail.ts:883-885` already classifies a local commit as reversible and
  in-remit. It supports the fix, so no change is needed.
- cinematiclab `.praxis/DISCIPLINES.md` law 36 ("commit before you fan out") binds the
  coordinator's own tree and was corrected on 2026-09-23. It does not ban lane commits.

## How to verify (falsify before you fix)

1. **Mechanical.** `pnpm canon:project:targets` (or the current projection command), then grep the
   projected `deliver`/`design` skills for `accepts : commit` and the projected agents for any commit
   duty. H1 and H3 predict: present and absent, respectively.
2. **Behavioural, before.** Cold-dispatch an orchestrator holding `skill://deliver` with a
   synthetic multi-lane cutover unit in a scratch git repo whose `CLAUDE.md` says "commit at every
   natural boundary". Capture its `task` dispatch text. H predicts that some lane is told not to
   commit, or to commit only when green or accepted. If no such wording appears across a few runs,
   H1 is falsified as the primary cause: look instead at the harness text (H4) and at
   orchestrator-specific instructions.
3. **Behavioural, after.** Apply R1–R2, re-project, and re-run step 2 on the same unit. H predicts
   dispatches that let lanes commit their own paths at coherent steps, and at least one commit
   per lane before the unit's acceptance.

## Proposed rectification (removals first)

- **R1 — remove the conflation.** In `design/skill.ts`, delete `accepts : commit → 𝔹`. Acceptance
  is a state transition of the unit (the assay, then `ready/`→`completed/`). Any commit that
  happens to contain that transition records it, but acceptance never gates a commit. Consider
  whether `commit` needs a definition in the design skill at all once `accepts` is gone. If
  `amends` is its only other user, `amends : act × C` may do. In `deliver/skill.ts`, drop the
  `commit @ design` / `accepts @ design` imports and change "two commits" (`:122`) to "two acts".
- **R2 — move, don't add, the commit duty.** Relocate the commit-autonomous rule from the
  cratylus-only `repo-preamble` into a canon cell that every write-layer agent carries (the
  implementer role at minimum, and the orchestrators, which also write). State it as durability,
  not acceptance: "commit your own paths at every coherent step, formatter first on those paths by
  pathspec, naming anything still red in the message. No dispatch withholds this." Keep
  cratylus's `AGENTS.md` deriving from the same cell so there is one home (dry).
- **R3 — no change to omp.** H4 is handled by R2's pathspec clause.

## Acceptance for the fix

- The projected `design` and `deliver` skills carry no definition under which a commit implies an
  acceptance.
- Every projected write-layer agent carries the commit duty, including the pathspec-formatter
  clause.
- Step 3 above: in a multi-lane unit, each lane commits at least once before the unit is accepted,
  and no dispatch conditions a commit on green or on acceptance.
