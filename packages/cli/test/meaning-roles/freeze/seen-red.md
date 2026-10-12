# meaning-roles: freeze checks seen red, at the record

Scope: workflow/24–38, rebound under 0128, 0129 and 0125 to where the record refuses: the journal before appending, and git's `reference-transaction` hook before a branch takes a change in. This record replaces the attempt-time one (F1–F7, 2026-10-11). `findings-seen-red.md` covers `findings.test.ts`. No product source, example, journal entry or held-out file was changed.

## What the checks run

- **Delivered code.** The packaged `cratylus`, installed in a temporary prefix by the suite's global setup, and the omp extension that installation projects, loaded through the binding fixture. Only omp's host services are substituted.
- **The fixture repository.** Each test opens the renewal cut, makes two commits (the cut's design, checks and `lib/`, then the work `src/renewal.ts`) and wires the record exactly as the contract states: `.git/hooks/reference-transaction` holding `#!/bin/sh` and `exec cratylus freeze-gate "$@"`, mode 0755, with `core.hooksPath` set to `.git/hooks`. The ledger stays uncommitted, where cratylus keeps it: what is frozen is what `cratylus workPackage frozen` reports.
- **The acting agent.** `CRATYLUS_AGENT` of the git process (absent and empty are also tried).
- **What is frozen.**
  - The example `design/examples/library/renewal.md` and the held-out text `design/judgment/library/renewal.md`, both from opening.
  - The checks `checks/renewal.test.ts` and the folder `checks/renewal/`. Each is run with node, must fail on staff-only access and pass on patron access, and only then goes to `workPackage freeze`. They name `library/1`.
  - Files a frozen check uses: `checks/support/access.ts` (a relative import), `lib/patron.ts` (reached through it), and `checks/support/types.ts` (a type-only import written `./support/types.js`, the TypeScript specifier).
  - Not frozen: `src/renewal.ts`. The check imports it, but it is the work package's output.
- **Routes**, each tried for every target: `commit`, `commit --no-verify`, `commit --amend`, `merge --no-ff` of a loose commit (built with `commit-tree`, no ref moved), `cherry-pick`, `rebase` (replays the branch's last commit onto a loose commit that changes the path), `commit-tree` + `update-ref`, `commit-tree` + `merge --ff-only`, `git rm -r` of the folder holding the path then a commit, and `git mv` of that folder then a commit.
- **Refused** means git exits non-zero, the branch is unchanged, HEAD is unchanged, and the output names `renewal`, the architect and the path (or the frozen folder registration holding it). HEAD is exempt for `rebase` only: git detaches HEAD before it moves the branch, and the branch is the record. The output is exempt from naming the architect and path in one case: deleting or moving `design/examples/library/` takes the cut's examples out of the working copy, so what is frozen can no longer be read there, and the refusal may be the unread freeze's. It must still refuse, keep the branch and name the cut.
- **Admitted** means git exits 0, the branch moves, and its tip holds the change.
- **Harness.** Sessions are launched as an agent: main (omp's `--agent` flag) or dispatched. `write` and `bash` calls fired through the binding must not be blocked. The host then runs the call as omp would:
  - the command the handlers leave (they may revise `event.input`);
  - in the fixture's environment, plus any `CRATYLUS_AGENT` the binding leaves in the host process (children inherit it);
  - plus any `env` the handlers give the call (omp's bash tool takes one).

  The ambient `CRATYLUS_AGENT` is removed for the test and restored after.

- **Lifecycle Givens.** These use the extension's real dispatch, return and verdict handlers. A builder is dispatched only after the checks are frozen (0129).

## Bindings

Test names in `structural.test.ts` unless marked P (`proof.test.ts`).

| Example     | Check                                                                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| workflow/24 | lead supersession while building, refused before appending (kept)                                                                                                                                                                                                  |
| workflow/25 | retirement by each of five roles and by an absent or empty identity (kept)                                                                                                                                                                                         |
| workflow/26 | architect supersession; earlier history exact (kept)                                                                                                                                                                                                               |
| workflow/27 | architect retirement; earlier entries exact (kept)                                                                                                                                                                                                                 |
| workflow/28 | unrelated opening-hours, both verbs, admitted to the lead (kept)                                                                                                                                                                                                   |
| workflow/29 | film approval refused, museum approval admitted, architect admitted (kept)                                                                                                                                                                                         |
| workflow/30 | integration releases renewal to the journal (kept)                                                                                                                                                                                                                 |
| workflow/31 | before any builder: the frozen view; the lead's supersede and retire; every route × example, check, used file, held-out text; a plain commit of the check-folder file, the direct import and the type import; an absent or empty agent; an unrelated file admitted |
| workflow/32 | returned and judging × lead, builder, check-writer, illustrator, assayer: both journal verbs, every route × four targets, plain commits of the other three; the builder's commit of its output admitted                                                            |
| workflow/33 | finding and rebuild: lead supersession and every route × four targets                                                                                                                                                                                              |
| workflow/34 | architect correction in judgment, then lead and assayer still refused (kept)                                                                                                                                                                                       |
| workflow/35 | in judgment: the architect's commit of the example, then separately of the check, admitted; the assayer's and check-writer's every route × example and check refused                                                                                               |
| workflow/35 | main and sub, through the binding: a lead session's write lands in the working copy and its shell commit is refused; an architect session's shell commit is admitted; a later lead session is still refused (also binds 31's working copy)                         |
| workflow/36 | complete, not integrated: both journal verbs and every route × four targets                                                                                                                                                                                        |
| workflow/37 | after integration: frozen view empty, journal verb admitted, plain commit of each target and every route on the example admitted                                                                                                                                   |
| workflow/38 | one cut integrated, the other still freezes renewal (kept)                                                                                                                                                                                                         |
| F1/F6, F4   | identity reaches the concept capability; the lead cannot integrate (kept)                                                                                                                                                                                          |
| P           | oracles: journal refusal, commit refusal (including the unread-freeze naming), admission; stand-in controls; lifecycle Givens                                                                                                                                      |

## Stand-ins and the clause record

- `MEANING_FREEZE_STAND_IN=admit` puts in front of the delivered command a record that admits every change. Its `freeze-gate` exits 0, and its journal `supersede`/`retire` run with the ledger moved aside.
- `MEANING_FREEZE_STAND_IN=refuse` puts in front a record that refuses every change. Its `freeze-gate` refuses every prepared transaction, and its journal refuses every `supersede` and `retire`.
- Everything else passes to the delivered command. P's stand-in controls show each stand-in does what it says.
- `MEANING_FREEZE_CLAUSES=<file>` records the outcome of each refusal, admission, binding and view clause, one JSON line each, and carries on past a failed clause. A seen-red run therefore observes every clause, not just each test's first failure. Without it, a failed clause fails its test at once.
- The earlier `MEANING_FREEZE_RED=overfreeze` mutation at the assertion boundary is removed; the refusing stand-in replaces it. An acceptance run sets neither variable.

```sh
cd packages/cli
pnpm exec vitest run test/meaning-roles/freeze --reporter=verbose
MEANING_FREEZE_STAND_IN=admit  MEANING_FREEZE_CLAUSES=/tmp/clauses-admit.jsonl  pnpm exec vitest run test/meaning-roles/freeze
MEANING_FREEZE_STAND_IN=refuse MEANING_FREEZE_CLAUSES=/tmp/clauses-refuse.jsonl pnpm exec vitest run test/meaning-roles/freeze
```

## Observed, 2026-10-11, branch head `1608b99b` plus these checks

Clause counts are for the whole folder.

| Run                              | Refusal clauses               | Admission clauses         | Test result          |
| -------------------------------- | ----------------------------- | ------------------------- | -------------------- |
| record that admits every change  | **768 of 768 failed**         | 61 held, 2 failed (below) | —                    |
| record that refuses every change | 12 held (the unread freeze's) | **63 of 63 failed**       | —                    |
| delivered work, clause record    | 716 failed, 52 held           | 48 failed, 15 held        | —                    |
| delivered work, plain run        | —                             | —                         | 23 failed, 36 passed |

- **Delivered work.** Every commit-level test fails: `cratylus: unknown command 'freeze-gate'` refuses every branch update without naming the cut, its architect or the path, so every admission fails. The binding's attempt-time gate still blocks the lead's `write` and `bash` calls (8 binding clauses failed, 4 held, those of architect sessions). The 52 refusal clauses that hold are the journal's refusals, already built, plus the unread-freeze commit refusals, which an unknown command passes vacuously. Both kinds are seen red against the admitting record. The journal's admission clauses hold (15).
- **Admitting record.** The 2 failed admissions are artifacts of that record's state, not of the checks. In the journal-entry case, the architect's commit of the supersede entry found it already committed by the admitted refusal. In workflow/29 (retire), the architect's retirement found approval already retired by the lead's admitted retirement.
- **Test level.** F1/F6 for the lead fail against the admitting record; F1/F6 for the architect fail against the refusing one. F4 does not touch the record: it passes against both stand-ins and the delivered work. Its seen-red is not recorded in this folder and was not re-observed here.
- **Green path, a throwaway control, not committed.** A stand-in `freeze-gate` was written per the contract, refusing a non-architect's branch update whose `git diff --no-renames` from the current tip touches a frozen path or brings in a supersede or retire entry for a frozen concept, and refusing when `workPackage frozen` fails. Against it the commit-level tests for 31, 32, 33, 35 (CLI), 36, 37 and the unread-freeze commit cases passed. The checks caught two defects in that control, the kind a realization can share. It trusted the hook's zero old value (git passes zeros when the old value is not verified), which made every file of the tree look changed. And rename detection hid the frozen paths of a moved folder. The 0125 case failed against it at the runtime's view (below), and the harness cases failed at the binding's gate.

## Retired

The attempt-time cases are removed:

- F7: a shell route changing an approved example, and a shell call impersonating the architect.
- `workflow/31 — main/sub: approval alone freezes the example`.
- Every `editPath` use in 31, 32, 33, 35, 36 and 37.
- P's gate oracle.
- F-route and F-timing in `findings.test.ts`.

Under 0128 the binding refuses no call for changing a file, and 35's harness case checks that.

## Not bound

- **0130** (a name set by hand) and **0131** (the project's hooks switched off) are open decisions; no check binds them.
- **Weak naming.** A refusal names `renewal` whenever it names a frozen path, because the paths carry the cut's name. `architect` is both the architect's name and its role's.
- **The unread freeze's message** is bound to refusal only; the contract gives it no wording.
