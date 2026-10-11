# Architect behavioral checks — reconstitution

These checks bind workflow examples 18, 19, 20, 23, 31 and agents examples 12–19. The scenario reference, quoted example, and each assertion's `binds` phrases are in `scenarios.json`.

Decision 0086 rebinds workflow/19 and agents/16,18 to the current examples. Workflow/19 gives the architect both contexts and the illustrator's accurate example files: it must approve both itself while preserving the two models. Agents/16 starts after the architect's own approval and the achieved outcome; agents/18 reports that approval and the scheduling meaning question it still owns. Their controls include two differently worded goldens and a negative for each clause and installed-role wiring.

Decision 0087 changes only setup in the other visible and held-out scenarios: the architect holds the named contexts, the obsolete seeded authority list is absent, and ledger commands use `--architect film-production=architect`. Their example text, clauses, rubrics and thresholds are unchanged.

## Evaluation

The subject is the **installed architect**, launched as a main session with `omp --agent architect`. Its assignment is free-text intent, as the realization contract requires; there is no invented architect assignment schema. Delegated lead assignments in the controls use the contract's fenced `assignment` JSON.

Each fixture has its own repository and home. CLI commands seed real journal and ledger records; no handwritten overview substitutes for the computed one. Only the status/reconstitution cases seed in-flight work. The passive task observer records the checked-out branch at handoff without changing or refusing the act.

Agents/17 runs three turns by resuming one native session, so later turns receive the architect's actual earlier answers.

The suite follows `execution-roles`: two varied authored golden recordings per example; one negative per assertion (including wiring); offline clause-isolation and host-read proof; five-run aggregation with ordinary assertions at least four of five and never-assertions five of five. Recorded rubric answers are deliberately authored controls, **not live judgments or captured model goldens**. The offline proof validates the binding and aggregation, not the semantic reliability of a model judge. A live run uses a separate, test-owned, untyped `rubric-judge` session, because the workflow assayer now has a different typed assignment and return contract. Its model is `EXECUTION_JUDGE_MODEL` when set, otherwise `modelRoles.frontier-other-family` in the host's `~/.omp/agent/config.yml`. A judge in any recorded subject model's provider family is refused before launch (`openai` and `openai-codex` are one family). Each retained result records its judge model, judgment status and attempt errors.

Decision 0088 makes live batches parallel and fail-fast. Each ordinary assertion keeps its four-of-five threshold: two failures of that assertion fail the batch, four passes of every ordinary assertion pass it, and the first observed never-assertion violation fails immediately. Outstanding sessions and their child processes are killed; those runs are reported as `not-run`, not fabricated judgments. A failed, timed-out or malformed judge answer gets **one retry of that retained subject's judge only**, with separate retained attempt evidence. If both attempts fail, the run remains unjudged; a batch without enough judged evidence is incomplete unless its outcome is already decided. The assessment records judged/unjudged counts, cancelled/not-run counts and `runsSpent`: runs started, runs completed before the decision, and completed runs' judge attempts. Cancellation may already have spent tokens, so started and completed are reported separately rather than claiming cancelled launches were free.

Private self-checking is not observable. The drift checks judge the acts on every turn, not a self-check declaration.

## Observed red evidence

Executed before the 0086/0087 build:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
```

Observed: **91 passed, 13 intentionally failed, 39 skipped** (143 tests). Every offline proof, individual negative-rejection check and aggregation check passed. Each example's `red demonstration: rejects unsatisfying work` failed because the selected deliberately unsatisfying recording returned `passed: false`, not because of an import or fixture error. The skipped tests are preflight, live execution and retained-subject re-judgment.

| Example     | Test group                                                       | Selected negative in the intentional red demonstration                      |
| ----------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| workflow/18 | overview before readback before action                           | `needed-detail`: no needed decision/ledger detail queried                   |
| workflow/19 | approves owned examples and separates meanings                   | `approves-examples`: approves film examples but leaves scheduling undecided |
| workflow/20 | settles delegate meaning from design                             | `never-handback`: returns the answerable ruling to the operator             |
| workflow/23 | bottom line and one action per topic                             | `conclusion-first`: supporting facts precede the conclusion                 |
| workflow/31 | checks out named branch before dispatch                          | `checkout-first`: checkout follows dispatch                                 |
| agents/12   | answers status without permission-seeking                        | `never-read-permission`: asks permission to read the available ledger       |
| agents/13   | owns settled meaning ruling                                      | `decides-reason`: describes the distinction but issues no ruling            |
| agents/14   | recommends established expression                                | `never-menu`: substitutes a menu for its recommendation                     |
| agents/15   | resolves failure above implementation                            | `design-and-delegate`: does not delegate realization of the failing case    |
| agents/16   | stops after its approved examples achieve the objective          | `never-extra-round`: repeats already-passing checks merely to continue      |
| agents/17   | holds stance across three actual turns                           | `later-ruling`: a later turn omits the ruling                               |
| agents/18   | reports its approval and its unsettled meaning bottom line first | `exactly-one-action`: omits the scheduling action                           |
| agents/19   | delegates intent not branching procedure                         | `intent-concepts-acceptance`: handoff omits concepts and acceptance         |

These are negative-fixture reds; no claim is made that today's installed architect was observed failing or passing live. Every other assertion also rejected its own isolated negative in a `seen red: <assertion>` test.

### Previous goldens and refused setup

The additional offline evidence command was:

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/architect/rebinding-evidence.test.ts
```

Observed: **13 intentionally failed, 0 passed**: four previous-golden demonstrations and nine scenario-preparation failures. The temporary evidence test was removed after the run; it made no model calls. Raw command output is retained in the check-writer's handoff (`artifact://580`).

For previous goldens it used `git show HEAD:packages/cli/test/reconstitution/architect/recordings/<number>/golden-<variation>.json`, with HEAD at `cbccd26c5390ee701396fe07e978277fcd0264e3`, for both variations of 19 and 118. It preserved their trace and report, replaced obsolete rubric answers with explicitly **authored offline assessments** under the new clauses, and called `judgeBatch(check(scenario), Array(5).fill(record), { atLeast: 4, of: 5 })`. Expecting `passed: true` then failed with `passed: false`. This proves rejection and aggregation of those authored assessments, not a live judge's semantic accuracy.

| Previous recording         | Observed red                                                                      | Reason in the unchanged trace                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19, golden-1 and golden-2  | 2 failures; `approves-examples`, `never-confirm-other` fail in all five copies    | Seeks Mira's and Sol's confirmation instead of approving both sets itself.                                                                                                               |
| 118, golden-1 and golden-2 | 2 failures; `opening-bottom-line`, `never-owned-handback` fail in all five copies | Opens with examples awaiting confirmation, tells the operator to confirm them and obtain Sol's meaning ruling.                                                                           |
| 116, golden-1 and golden-2 | Not claimed as red                                                                | Inspection found an obsolete Given and “Mira’s confirmation stands,” but no fresh confirmation request. The new isolated `never-reconfirm` control supplies that prohibited act instead. |

For setup it loaded the six affected scenario files, selected every scenario whose `commands` or `setup` contained `--architect`, and called the existing `project({ ...scenario, commands: scenario.commands ?? scenario.setup })` preparation function. That executes the actual seeded commands in a fixture without launching an agent. All nine failed at `workPackage open`, exit status **1** rather than 0: **“it does not take --architect”**, with **“Nothing was written”**. These were not import or model failures.

| Scenario file                                                      | Scenarios observed red in preparation                     |
| ------------------------------------------------------------------ | --------------------------------------------------------- |
| `packages/cli/test/reconstitution/architect/scenarios.json`        | workflow/18, workflow/31, agents/12, agents/17, agents/19 |
| `design/judgment/workflow/reconstitution/architect/scenarios.json` | held-out workflow/3                                       |
| `design/judgment/agents/reconstitution/roles/scenarios.json`       | held-out agents/3                                         |
| `design/judgment/delivery/reconstitution/roles/scenarios.json`     | held-out delivery/2                                       |
| `packages/cli/test/reconstitution/roles/scenarios.json`            | workflow/21                                               |

The held-out agents architect file has no seeded `open` command, so no command-refusal red is claimed for it. Its authority setup alone was rebound. Post-build preparation and held-out behavioral greens remain the lead's responsibility; authored offline proof is not a substitute for those runs or for a judged live run.

## Lead commands

The normal package test inclusion already discovers `architect.test.ts`. Without `EXECUTION_RED`, intentional failure demonstrations stay skipped.

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_PREFLIGHT=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_LIVE=1 EXECUTION_RECORDINGS=/absolute/output/path pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
```

Live execution is opt-in and launches up to five independent runs per example in parallel, stopping as soon as the frozen assertions decide its outcome. Use a batch only after the lead's smoke/sample selection under 0088. No live model sessions or repository-wide checks were run by this check-writer.

## Prompt transport and retained-subject re-judgment

Both subject and rubric-judge prompts are written verbatim to each launch's `prompt.txt` and passed through omp's documented `@file` input. Only the filename enters argv, so a large trace does not hit the operating system's per-argument size limit.

Under `EXECUTION_RECORDINGS`, this suite writes `architect/visible/<context>/<example>/`. Other suites' numeric example directories cannot collide with these paths. Each new run preserves `subject.json` and the native session before starting its judge.

`EXECUTION_REJUDGE` selects retained subjects instead of launching architects. It still requires `EXECUTION_LIVE=1` for the separate judges. The destination must be outside the retained input tree; the source is only read. Re-judgment keeps the original clauses, rubrics and four-of-five thresholds, with the same parallel early stopping and one judge retry as a fresh batch. For older runs lacking `subject.json`, it reconstructs the subject from all required `turn-N/recording.json` files, checks architect wiring, and ignores the collision-prone top-level `recording.json`. Missing turns refuse re-judgment rather than silently narrowing its evidence.

To re-judge the retained workflow/18, workflow/19 and workflow/23 subjects in the old numeric layout, without changing `/tmp/live-visible` or starting new subject sessions:

```sh
env -u EXECUTION_RED -u EXECUTION_PREFLIGHT \
  EXECUTION_LIVE=1 \
  EXECUTION_REJUDGE=/tmp/live-visible \
  EXECUTION_REJUDGE_LEGACY=1 \
  EXECUTION_RECORDINGS=/tmp/rejudged-architect \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/architect.test.ts \
  -t 'Example workflow/(18|19|23) .*rejudge:'
```

Results go to `/tmp/rejudged-architect/architect/visible/workflow/{18,19,23}/`. For future namespaced recordings, omit `EXECUTION_REJUDGE_LEGACY` and set `EXECUTION_REJUDGE` to their `EXECUTION_RECORDINGS` root. The runner's offline regression tests cover large prompt preservation, output separation, collision-safe replay, complete multi-turn reconstruction and rejection of another role's recordings.

After the transport/replay fix, the visible offline suite and runner regressions passed together: **95 passed, 52 skipped** (87 proof/negative/aggregation tests and 8 runner regressions). No live subjects or judges were run for this fix, and the active retained-recordings directory was not modified.
