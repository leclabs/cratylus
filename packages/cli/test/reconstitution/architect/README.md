# Architect behavioral checks — reconstitution

These checks bind workflow examples 18, 19, 20, 23, 31 and agents examples 12–19. The scenario reference, quoted example, and each assertion's `binds` phrases are in `scenarios.json`.

Decision 0086 rebinds workflow/19 and agents/16,18 to the current examples. Workflow/19 gives the architect both contexts and the illustrator's accurate example files: it must approve both itself while preserving the two models. Agents/16 starts after the architect's own approval and the achieved outcome; agents/18 reports that approval and the scheduling meaning question it still owns. Their controls include two differently worded goldens and a negative for each clause and installed-role wiring.

Decision 0087 changes only setup in the other visible and held-out scenarios: the architect holds the named contexts, the obsolete seeded authority list is absent, and ledger commands use `--architect film-production=architect`. Their example text, clauses, rubrics and thresholds are unchanged.

## Evaluation

The subject is the **installed architect**, launched as a main session with `omp --agent architect`. Its assignment is free-text intent, as the realization contract requires; there is no invented architect assignment schema. Delegated lead assignments in the controls use the contract's fenced `assignment` JSON.

Each fixture has its own repository and home. CLI commands seed real journal and ledger records; no handwritten overview substitutes for the computed one. Only the status/reconstitution cases seed in-flight work. The passive task observer records the checked-out branch at handoff without changing or refusing the act.

Subject launches keep `--no-extensions` to exclude host discovery, then explicitly load every JavaScript/TypeScript extension module installed in the fixture's `.omp/agent/extensions/`, including `cratylus-session.ts` and its guards and session hooks, before the passive observers. Rubric judges load the installed `cratylus.ts` adapter, which registers `--agent`, plus observers; they never load `cratylus-session.ts` or other subject extension modules. Retained wiring lists the installed module paths. For a declaration with the reconstitution procedure, no-model preflight also checks that the session module contributed its first-turn reconstitution note; the recording preserves that observation without adding or changing any example assertion.

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

### Continuing-session setup (0089)

Agents/16, agents/18 and workflow/23 now supply the architect's earlier readback through `history`, rather than presenting a mid-session Given to a fresh session. The existing runner writes these user/assistant turns into its native session file and resumes that session for the evaluated turn. Each readback distinguishes creative acceptance, release permission and date reservation, names `creative-not-release` as accepted, and reports no recorded cuts, matching the seeded ledger. Agents/18 and workflow/23 also name `night-shoots` as open. Agents/16 does not seed that open decision, so its readback does not invent one. Agents/16 and agents/18 include the architect's earlier approval of the film-production examples.

No example text, prompt intent, clause, rubric or threshold changed. The agents/16 `never-repeat` negative is now `negative-continuing-discovery.json`: it includes the prior readback and approval, then the completed-outcome prompt, then recorded calls that reread both overviews and the design state. Its authored answer rejects that renewed discovery; it is not rejecting required reconstitution at a fresh session's start. The filename makes this the example's selected intentional red demonstration.

Observed offline evidence after this setup rebind:

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts -t 'Example (agents/(16|18)|workflow/23) '
EXECUTION_PREFLIGHT=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts -t 'Example (agents/(16|18)|workflow/23) .*preflight'
```

| Run                                          | Observed result                                    |
| -------------------------------------------- | -------------------------------------------------- |
| Architect offline suite                      | **91 passed, 52 skipped**                          |
| Three examples with intentional reds enabled | **28 passed, 3 intentionally failed, 112 skipped** |
| Three no-model preflights                    | **3 passed, 140 skipped**                          |

The three intentional failures returned `passed: false`: agents/16 rejected `never-repeat` after the continuing-session history; agents/18 still rejected its missing scheduling action (`exactly-one-action`); workflow/23 still rejected support before the conclusion (`conclusion-first`). The offline proof also passed the updated negative's clause isolation, tool-schema wiring and never-assertion aggregation. Preflight verifies scenario preparation and installed declaration/tool composition without a model; it is not a live behavioral verdict. No live sessions were run.

The same 0089 setup rule also applies to workflow/31 and agents/19: each Given already has a confirmed cut ready for lead dispatch. Their `history` now includes the architect's earlier readback of both models, the accepted `creative-not-release` decision, the open scheduling `night-shoots` decision, and the recorded `film-approval` cut on `feature/film-approval`. A second prior turn approves the cut and its examples and names its branch. History does not claim that checkout or dispatch has happened; those remain the evaluated acts. No prompt, example text, clause, rubric or threshold changed.

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts -t 'Example (workflow/31|agents/19) '
EXECUTION_PREFLIGHT=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts -t 'Example (workflow/31|agents/19) .*preflight'
```

Observed: **12 passed, 2 intentionally failed, 129 skipped** for the selected offline/red run, and **2 passed, 141 skipped** for no-model preflight. Workflow/31 still rejects checkout after dispatch (`checkout-first`); agents/19 still rejects the handoff missing concepts and acceptance (`intent-concepts-acceptance`). Both intentional demonstrations returned `passed: false`; all selected offline proofs, individual negatives and aggregation checks passed. No live sessions were run.

### Native model restoration for continuing sessions

The earlier preflights above checked preparation and installed composition, not history restoration. History and compaction preflights now also resume the synthesized native session and reach `before_agent_start`, still exiting before a provider request. Neither the initial inspection nor the resumed launch supplies a `--model` override.

The passive observer retains omp's resolved provider, model ID and API. The native history records that identity in both its `model_change` entry and every authored assistant message, with valid zero-usage setup metadata. Live execution copies its authorized credentials **before** the initial inspection, so omp resolves the installed architect's declaration, role aliases and authentication fallback just as it does for the live turn. Missing model observation refuses session construction instead of inventing an identity.

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/runner-extensions.test.ts \
  -t 'architect native history restoration' --no-file-parallelism
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/runner-extensions.test.ts \
  test/rubric-judge.test.ts test/rubric-batch.test.ts \
  test/reconstitution/architect/runner.test.ts --no-file-parallelism
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_REJUDGE \
  EXECUTION_PREFLIGHT=1 EXECUTION_RECORDINGS=/tmp/reconstitution-native-history-proof \
  pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts \
  -t 'Example (agents/(16|18|19)|workflow/(23|31)) .*preflight' --no-file-parallelism
```

Observed red before the fix: **3 failed, 6 skipped**. Native history lacked its model selection; preflight never resumed history; absent model observation was silently accepted. After the fix the four offline harness files passed **36 tests**. The five real resumed preflights passed **5 tests, 138 skipped**, retaining evidence below `/tmp/reconstitution-native-history-proof/architect/visible/`. In the credential-free agents/16 preflight, omp selected and restored `fixture/base` (`openai-completions`); this proves native restoration, not the authenticated live model selection or behavioral acceptance. No live subject or judge generations were run.

### Owned decisions during an update (0090)

Workflow/23's `one-action` and `product-support` rubrics and agents/18's `opening-bottom-line`, `exactly-one-action` and `product-support` rubrics now tell the judge that a scheduling decision taken in the evaluated turn and reported with its reason is that topic's outcome and action. No extra future action is required, and reporting the question settled is not replacing an unresolved condition. Workflow/23's `conclusion-first` already assesses order without requiring an unresolved condition, so it is unchanged. Example text, clause IDs, binds and thresholds are unchanged.

Each example has an additional `golden-3.json`: the architect allows night shoots under the same reservation rules as daytime shoots and explains that scheduling reserves a date and time independently of creative acceptance. That settled decision supplies the scheduling action; the report does not artificially keep the question open. The other authored controls' otherwise conforming scheduling passages now leave the question open only for an identified missing input, the venue's night-time access restrictions, and state the one action being taken to obtain it. They no longer defer an owned ruling without a need.

Each example also has `negative-a-settled-without-reason.json`, selected by its intentional red demonstration. It reports a settled night-shoot ruling and an explicit action to apply it, but gives no reason for that ruling. Only `product-support` fails; the explicit action keeps this negative separate from an omitted-action failure. Existing omitted-action negatives remain covered.

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts -t 'Example (workflow/23|agents/18) '
```

Observed: the full architect offline suite passed **93 tests, 52 skipped**. The selected red run had **22 passed, 2 intentionally failed, 121 skipped**. Both demonstrations returned `passed: false` for the new reasonless-ruling negative. The ordinary proof accepted the new settled goldens and rejected every isolated negative, including the existing omitted-action controls. These are authored rubric-answer controls, not live judge judgments; no model sessions were run.

## 0091: judged on what takes effect

`test/rubric-delivered.ts` projects retained messages into `{ delivered, heldDrift }`. Both architect and execution-role rubric prompts use only the delivered messages (and the architect's snapshots); they do not reintroduce a refused reply through the duplicate raw `report`. Refused calls and replies are not evidence for any clause. Ordinary tool errors and successful acts remain evidence, in order. No example, clause, rubric or threshold changed.

The original `subject.json` and the judged recording's messages stay intact. Each `recording.json` and `judged.json` also records `heldDrift`: one `{ guard, attempt: "call" | "reply", tool?, input?, text?, reason }` per refused attempt. `guard` is its canonical ID, or an array of IDs when several guards jointly refuse one attempt; call entries retain their tool input and reply entries their refused text. Batch results and `assessment.json` report `{ total, byGuard }` under `heldDrift`, both for each run and overall, independently of pass/fail. A joint refusal counts once in `total` and once for each guard in `byGuard`. Returned siblings not consumed by fail-fast still contribute their drift, never an invented rubric verdict.

The three fixtures in `fixtures/` are excerpts copied from `/tmp/smoke11/{agents-13,workflow-31,agents-16}/subject.json`: only relevant messages, with thinking and model/usage metadata removed. Agents/13 retains three refused calls, its refused reply, intervening successful calls and the corrected final reply. These are transcript controls, not authored rubric answers or new live runs.

Executed offline:

```sh
pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts -t 'removes the refused agents/13 reply'
pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts test/rubric-batch.test.ts -t '0091'
pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts test/rubric-batch.test.ts -t 'combined refusal|jointly held'
pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts test/rubric-judge.test.ts test/rubric-batch.test.ts test/execution-roles test/reconstitution/roles
```

Before the prompt change, the first command was **1 failed, 11 skipped**: the actual architect prompt still contained “so I won't settle it without your intent.” Before wiring projection/reporting into judging, the second command was **5 failed, 10 passed, 19 skipped**: both prompts still included that reply, judged recordings lacked drift, and both batch paths lacked drift counts. The combined-refusal check was then **3 failed, 34 skipped**: the newly installed bottom-line guard was not recognized, joint refusals lost their second guard, and totals did not count them. Final acceptance was **6 files passed; 185 passed, 82 skipped**. No subject or judge model sessions ran.

### Re-judging a flat smoke directory

The existing namespaced replay path already accepts symlinked `run-1` directories. For example, the **lead may run** the following (not executed for this change):

```sh
mkdir -p /tmp/smoke11-replay/architect/visible/agents/{13,16} \
  /tmp/smoke11-replay/architect/visible/workflow/31
ln -s /tmp/smoke11/agents-13 /tmp/smoke11-replay/architect/visible/agents/13/run-1
ln -s /tmp/smoke11/agents-16 /tmp/smoke11-replay/architect/visible/agents/16/run-1
ln -s /tmp/smoke11/workflow-31 /tmp/smoke11-replay/architect/visible/workflow/31/run-1
env -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE_LEGACY \
  EXECUTION_LIVE=1 EXECUTION_REJUDGE=/tmp/smoke11-replay \
  EXECUTION_RECORDINGS=/tmp/smoke11-rejudged-0091 \
  pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts \
  -t 'Example (agents/(13|16)|workflow/31) .*rejudge:'
```

`EXECUTION_LIVE=1` authorizes only the separate judges here: `EXECUTION_REJUDGE` disables fresh subject runs and applies the same projection through `judgeRecording`. The source is read-only and the output is outside it. A single smoke subject is not four-of-five evidence: absent runs 2–5 remain unjudged, so a conforming smoke result leaves the batch **incomplete**, not passed; the suite's batch-pass assertion will fail. Inspect `run-1/judged.json` for that subject's answers and held drift, and `assessment.json` for the unchanged batch verdict. Never duplicate one smoke recording to manufacture independent runs.

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
