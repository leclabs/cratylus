# Hypothesis — orchestrators withhold lane commits because nothing they read defines a commit as durability

Status: **RECTIFIED 2026-09-25.** The original hypothesis (H1: the canon's design/deliver skills
model a commit as the carrier of an acceptance, and orchestrators derive "no commit before
acceptance" from that) is **falsified** as the cause. The session evidence and a controlled
dispatch experiment both locate the cause elsewhere: in the boundary definition of the commit
rule the orchestrator was actually reading, in the harness's own delegation text, and in the
canon projecting no commit duty at all. The canon-level lever is the original H3, not H1.

## The observed failure (verified)

An orchestrator running `skill://deliver` in `~/workspaces/cinematiclab` (session
`~/.omp/agent/sessions/-workspaces-cinematiclab/2026-09-25T04-54-22-527Z_01a0d6ea-1e3f-72ad-a4dd-0c8e20d831ee.jsonl`)
dispatched the clean-cutover unit `w1-the-face-is-total` to parallel implementer lanes in the
worktree `../cinematiclab-face`. Its dispatches withheld every lane's commit until the whole
unit was green: "Test lanes do NOT commit. FaceCore commits the whole unit on the branch once
everything is green" (JSONL line 278); "You are now the CORE OWNER … and the integrator who
commits" (line 337); "If you near the budget, commit nothing half-verified … then ONE commit on
the branch" (line 459). FaceCore and FaceFinish each stopped at the 200-request budget with
"Nothing is committed", and the work travelled between agents as
`.praxis/canvas/evidence/w1-the-face-is-total.wip.patch`, reaching 103 changed paths with no
commit.

The failure has since been corrected locally. At line 465 the orchestrator diagnosed its own
dispatch and checkpointed the branch (`49e1515`, "wip(slot): … checkpoint of the cutover, not
yet accepted"). Cinematiclab commit `9a80d1f` (2026-09-25 02:21 -0500) rewrote the repo's commit
rule. The branch `canvas/w1-face-is-total` now carries six commits.

## What the evidence rules out

**H1 (acceptance vocabulary) is not the cause.** The orchestrator's own reasoning at the
moment it first withheld commits (line 278) names a different premise: "since lanes running
concurrently in a worktree could hit the same index lock, I'm leaning toward having FaceCore
make a single coherent commit for the whole unit once all suites pass". No reasoning block at
lines 276–459 ties a commit to acceptance. Its self-diagnosis at line 465 names the green gate:
"I also mistakenly framed the unit as requiring a fully green suite before committing, but
since this is a branch, intermediate red commits are fine".

**The target repo did not "already have the right rule."** The original text claimed that
cinematiclab's rule was correct and the orchestrator wrote the prohibition anyway. The rule in
force at session start (`9a80d1f^:CLAUDE.md`, line 291, introduced by `1151089` on 2026-09-23)
read: "A boundary is a coherent change that **leaves the suite green**". A clean cutover is red
until its last path lands, so under that definition the unit has exactly one boundary, at the
end. The orchestrator's single-commit dispatch complied with the rule as written. `9a80d1f`
repaired precisely this clause ("on an isolated branch or worktree it is any coherent step, and
the message names what is still red").

## Experiment

Each arm made six stateless completions. The system prompt was the projected `mav` body,
optionally the projected `design` and `deliver` skills, optionally the omp `task` tool's
delegation text ("Shared edits need one integration owner … Every task MUST skip
build/lint/tests/formatters mid-flight"), and a repo-rules block that always stated a
prettier+eslint pre-commit hook. The user prompt asked for the verbatim `task` call splitting a
77-path cutover unit across lanes in one worktree. Each dispatch's commit sentences were
extracted and read.

| arm | skills                                  | task text | repo commit rule                              | lanes withheld from committing |
| --- | --------------------------------------- | --------- | --------------------------------------------- | ------------------------------ |
| A   | original                                | yes       | "commit at every natural boundary, binds all" | 0/6                            |
| B   | R1 applied (`accepts : commit` removed) | yes       | same                                          | 0/6                            |
| C   | none                                    | yes       | same                                          | 0/6                            |
| D   | original                                | no        | same                                          | 0/6                            |
| E   | original                                | yes       | none                                          | 6/6                            |
| F   | R1 applied                              | yes       | none                                          | 6/6                            |
| G   | none                                    | yes       | none                                          | 6/6                            |
| H   | original                                | yes       | cinematiclab's pre-session text, verbatim     | 6/6                            |
| I   | original                                | yes       | cinematiclab's `9a80d1f` text, verbatim       | 0/6                            |

The acceptance vocabulary is not a switch: E, F and G behave identically, with the skills
present, with R1 applied and with no skills at all. The commit rule is the switch. With no rule,
18 of 18 dispatches install one integrator who commits once at green, and the reasons they state
are the harness's integration owner, the ban on mid-flight formatters, and a pre-commit hook
that "would reject partial work". With the green-gated rule, 6 of 6 withhold, reproducing the
incident. With the durability rule, 6 of 6 tell every lane to commit its own paths at each
coherent step, formatter first, with the red named in the message, even though the harness text
is present.

The acceptance vocabulary does colour the wording once commits are already withheld. In arm H,
several dispatches describe the single final commit as "the acceptance only" or as the commit
"that carries the acceptance and no design amendment". That is a warm reading of
`accepts : commit → 𝔹`, but it arrives after the withholding decision and does not cause it.

## Rectified hypothesis

**H′.** An orchestrator splitting one unit across lanes in a shared worktree will centralize and
defer the commit unless something it reads defines a commit as durability, independent of
green and of acceptance. Three pressures push it that way, and all three are present by
default: the omp `task` text asks for one integration owner and no mid-flight formatters, a
pre-commit hook rejects unformatted or broken staged files, and concurrent lanes contend for one
index. A commit rule that defines a boundary as "leaves the suite green" does not counter this.
It ratifies it, because a cutover is green only at its end.

- **H3 is confirmed, and it is the canon's lever.** The only canon cell that mentions committing
  is `rules/repo-preamble.ts` (`scope: ''`, `targetPath: 'AGENTS.md'`), which reaches cratylus's
  own workspace and nowhere else. No projected agent under `~/.claude/agents/` or
  `~/.omp/agent/agents/` mentions a commit. Arms E–G show what that absence yields in any repo
  that does not supply its own rule. Arm I shows that the text of `9a80d1f` overrides the
  harness pressure when it is present.
- **H2 is textually true but secondary.** The implementer's archetype makes the spec "the whole
  of the mandate", so a lane will not overrule its dispatch. The dispatch is where the defect is
  written, which means the duty must reach the dispatcher first. A duty carried by the
  implementer as well is a second line of defense.
- **H4 is a co-cause, not only a constraint.** The harness text appears as a stated reason in
  the no-rule arms. It needs no change in omp, because arm I shows that a durability rule with a
  pathspec-formatter clause overrides it.

## Rectification

- **Do not apply R1 as written.** Deleting `commit` and `accepts` from `design` would not change
  behavior (arm F), and it would remove the carrier that the separation law depends on: the
  design skill's `commit ≜ … ⟨the append-only carrier · attribution ∧ order⟩` is what makes a
  retroactive amendment detectable, because the amendment postdates the artifact it excuses. A
  real but unrelated defect sat beside it: the separation law `∀ k : amends(k, c) ⇒ ¬accepts(k)`
  was stated twice, once in `design` ("two acts") and once in `deliver` ("two commits"), one law
  with two homes and two wordings. **Repaired 2026-09-25:** `deliver` no longer restates it or
  imports `commit`/`accepts`; it reaches the law through `amend(C) @ design`.
- **R2 stands, with its content taken from `9a80d1f`.** Every agent that dispatches writers and
  every agent that writes must carry the commit duty as durability: a commit is durability and
  never acceptance; on an isolated branch or worktree a boundary is any coherent step, and the
  message names what is still red; each writer stages and commits only its own paths by
  pathspec and runs the formatter on those paths first; no dispatch withholds a writer's commit.
  The natural home in the catalog is the existing `actions` value `file-ops ⟨filesystem vcs⟩`,
  whose `vcs` factor is exactly where commit semantics belong. At present only `nico` holds it,
  and neither the `implementer` role nor the dispatching roles do. The dispatcher side may also
  need a clause on `delegation`. Keep cratylus's `AGENTS.md` convention (Conventional Commits,
  push gated) as a repo rule, and have it cite the durability duty rather than restate it.
- **R3 (no omp change) stands.**

## Acceptance for the fix

- Every projected agent that writes or dispatches writers carries the durability definition,
  including the isolated-branch clause and the pathspec-formatter clause.
- A re-run of arm E against the re-projected agents, with no repo commit rule, yields
  dispatches in which every lane commits its own paths before the unit is green, and no dispatch
  conditions a commit on green or on acceptance.
- A re-run of arm H, where the repo's green-gated rule contradicts the projected duty, is
  recorded as a precedence measurement, not as a pass or fail criterion. A repo rule that gates
  commits on green is that repo's defect to repair, as cinematiclab did in `9a80d1f`.
