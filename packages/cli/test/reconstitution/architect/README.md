# Architect behavioral checks — reconstitution

These checks bind workflow examples 18, 19, 20, 23, 31 and agents examples 12–20. The scenario reference, quoted example, and each assertion's `binds` phrases are in `scenarios.json`.

Decision 0086 rebinds workflow/19 and agents/16,18 to the current examples. Workflow/19 gives the architect both contexts and the illustrator's accurate example files: it must approve both itself while preserving the two models. Agents/16 starts after the architect's own approval and the achieved outcome; agents/18 reports that approval and the scheduling meaning question it still owns. Their controls include two differently worded goldens and a negative for each clause and installed-role wiring.

Decision 0087 changes only setup in the other visible and held-out scenarios: the architect holds the named contexts, the obsolete seeded authority list is absent, and ledger commands use `--architect film-production=architect`. Their example text, clauses, rubrics and thresholds are unchanged.

Decision 0095 moves the former held-out agents/4 ordering case into visible agents/20, using `recordings/120/`. It resumes twelve conversational checkpoints; those opening turns are authored fixture data, not alleged live model output. The sibling visible roles suite now also binds delivery/11 (formerly held-out delivery/2), using `roles/recordings/11/`. The promoted examples are quoted from their current `design/examples` files; all clauses, rubrics and thresholds are retained.

## Evaluation

The subject is the **installed architect**, launched as a main session with `omp --agent architect`. Its assignment is free-text intent, as the realization contract requires; there is no invented architect assignment schema. Delegated lead assignments in the controls use the contract's fenced `assignment` JSON.

Each fixture has its own repository and home. CLI commands seed real journal and ledger records; no handwritten overview substitutes for the computed one. Only the status/reconstitution cases seed in-flight work. The passive task observer records the checked-out branch at handoff without changing or refusing the act.

Subject launches keep `--no-extensions` to exclude host discovery, then explicitly load every JavaScript/TypeScript extension module installed in the fixture's `.omp/agent/extensions/`, including `cratylus-session.ts` and its guards and session hooks, before the passive observers. Rubric judges load the installed `cratylus.ts` adapter, which registers `--agent`, plus observers; they never load `cratylus-session.ts` or other subject extension modules. Retained wiring lists the installed module paths. For a declaration with the reconstitution procedure, no-model preflight also checks that the session module contributed its first-turn reconstitution note; the recording preserves that observation without adding or changing any example assertion.

Decision 0094 routes fixture delegates to `delegate-stand-in.ts`, loaded explicitly for subjects in both the architect and sibling roles runners, never for rubric judges. At `session_start` it registers a replacement executor for the native `task`, preserving its description and parameter schema and not activating it for a role that lacks dispatch. Every assignment receives the same deterministic acknowledgement: “Assignment accepted. I will return the outcome for the assigned concepts.” It starts no child session and makes no model call; this is acceptance of an assignment, not a claim that its work passed or produced artifacts. Installed `tool_call` guards and the unchanged passive handoff observer still run before execution, so the subject's decision to dispatch, role, complete assignment and checked-out branch remain evidence under the same rubrics. The roles runner also loads that observer.

Replacement samples `pi.getActiveTools()` before registering and sets `defaultInactive` to the inverse of the native task's active state. A blanket `defaultInactive: true` is not preservation: omp re-evaluates activation on registration and removes task from an otherwise active surface. Main-session tool selection belongs to omp/operator flags; a declaration's `tools` alone narrows dispatched children, not the main session.

A retained run identifies the routing in its `launch.json` extension arguments and in each successful `task` tool result: `details.fixture` is `delegate-stand-in`, `details.input` is the complete dispatched input, and `content` contains one acknowledgement per task. `messages.jsonl` and the resulting subject/turn recordings also keep the original assistant call and the passive `branch-at-handoff` observation. No failure result is suppressed or rewritten: the native child executor is never entered.

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

### Fixture delegates (0094)

The original failure is retained at `/tmp/batch4/architect/visible/workflow/23/run-5/turn-1/recording.json`: the architect dispatched `NightShootExamples` to the installed `illustrator`; the native task started an asynchronous job, whose result failed with “No model selected” and named `/tmp/agent-launch-0L3pOp/home/.omp/agent/agent.db`. Its final reply then made the helper's inability to start part of its update. That evidence was read, not replayed.

The fixture's allowlisted environment sets `HOME` to its own empty home. Installation with `--model-roles default` seeds agent aliases, not missing host model choices: `illustrator` points to `@frontier-other-family:high`, but that tier, `frontier` and `default` are unset. Live setup copies authentication databases only, not host configuration. In omp, `task` resolves the delegate's own role and constructs a child session inside this fixture environment; it is not another CLI launch receiving the parent's `--agent` setup. Native `resolveModelOverrideWithAuthFallback` returns an unresolved primary when there is no model, rather than repairing an absent tier with the parent's active model. `AgentSession` then refuses the child's prompt before a model request. The authenticated parent's working model therefore does not establish that an installed delegate's alias resolves. The routing test checks the installed illustrator alias and absent tiers directly; 0094 removes this fixture dependency instead of copying more host state or changing the product.

`recordings/23/negative-delegate-failure.json` is an **authored offline control**, not a model judgment. Its tool result says the delegate could not start; the subject opens its report with that failure and reassignment as a separate topic, before the film/scheduling bottom line. The existing `conclusion-first` clause rejects it. The two product outcomes, their single actions and reasons remain intact; offline clause isolation rejects only that ordering clause.

```sh
env -u EXECUTION_LIVE -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  EXECUTION_RED=1 pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/delegate-stand-in.test.ts -t 'seen red \(0094\)'
```

Observed: **1 intentionally failed, 3 skipped**. The five-copy batch returned `passed: false` when the demonstration expected `true`; this was an ordering-control rejection, not an import, fixture-setup or model error (`artifact://1111`). The normal test expects that rejection. No clause, rubric, threshold, scenario or example text changed.

The routing check uses the real installed omp and fixture adapter with a loopback scripted transport, not a live model. One task call carries lead and illustrator assignments; the native guards admit it after checkout of `feature/film-approval`. The result contains two fixed acknowledgements, the original input and the `delegate-stand-in` marker. The unchanged passive observer records the same input and branch. Exactly two scripted subject requests occur (dispatch and final response), with no child turn or child model request. Unit checks also preserve native schema/description and avoid introducing dispatch when task is absent. Runner wiring checks cover both subject launchers and exclusion from rubric judges.

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/reconstitution test/runner-extensions.test.ts
```

Observed: **237 passed, 75 skipped across 13 files** (`artifact://1113`), including all four stand-in tests, the new negative's ordinary clause-isolation proof and both launchers' wiring checks. Biome passed on the six changed TypeScript/JSON files. No live subject or rubric-judge model sessions were run.

#### Preserving the offered task tool

The initial routing proof had a blind spot: its scripted transport issued `task` without checking that the subject's request actually offered it. The registration's blanket `defaultInactive: true` hid task in ordinary subject launches. The rebound real-omp check now inspects the first model request's tool list, and its script dispatches only when task is offered. Both native-default and task-declaring subjects must expose it without a `--tools` override; a read-only-tools declaration launched with the operator's `--tools read` selection must not gain it. Active cases still check both acknowledgements, complete inputs, checked-out branch and absence of child requests.

Seen red against the unchanged stand-in from `1a19b3b5`:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/delegate-stand-in.test.ts -t 'real omp preserves'
```

Observed: **2 failed, 1 passed, 3 skipped**. Both active cases failed the new request-tool assertion with `false` instead of `true`: task was absent. No live model sessions ran.

After preserving the sampled active state:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/delegate-stand-in.test.ts test/runner-extensions.test.ts
```

Observed: **16 passed across 2 files**: seven stand-in checks, including both active surfaces and the operator-narrowed inactive surface, plus nine launcher wiring/restoration checks. The active subjects received the acknowledgements through an actually offered task tool; the inactive subject made no tool call.

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

### Recording and fixture sweep (0095)

The complete [174-artifact audit](../RECORDING-AUDIT.md) distinguishes example approval from domain acts such as creatively accepting a film. Workflow/23's omitted-action negative now approves the film examples itself. All twelve workflow/31 and agents/19 controls now begin with the architect's prior approval instead of Mira's confirmation. Existing hand-back and reconfirmation negatives remain deliberate failures, including the retained agents/13 refused-reply fixture.

The temporary `recording-sweep-evidence.test.ts` used `assess` to require each rebound negative's failures to equal `[breaks]`, then deliberately expected the five-copy `judgeBatch(check(scenario), Array(5).fill(recording), { atLeast: 4, of: 5 })` to pass. It also tested the previous goldens using `git show 16e04430b104e234bcf1061d91c99605f1fd96bb:<path>`. The temporary test was removed after this command:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/recording-sweep-evidence.test.ts
```

Observed: **17 intentionally failed, 4 passed** (`artifact://1251`). Fifteen negatives first passed exact-clause isolation and then failed at `passed: false`; two previous held-out agents/4 goldens failed `minimal-support` with explicitly authored current-clause answers (see that suite's README). The visible negatives were `23/one-action`, all five in `31/`, and all three in `119/`, including installed-role wiring.

The four passing previous goldens are the two variations in `31/` and `119/`: their Given contains obsolete confirmation, but their actual dispatch behavior still satisfies every current dispatch clause. They contain no fresh confirmation request or approval hand-back. No rejection of those setup-only defects is claimed; adding a clause to detect them was outside this assignment.

Acceptance, with no live model sessions:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/reconstitution
# For each of the eight design/judgment/*/reconstitution/*/vitest.config.ts files:
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run --config ../../<config>
pnpm --filter cratylus typecheck
pnpm exec biome check <the 21 rebound JSON paths listed in RECORDING-AUDIT.md>
```

Observed: visible **231 passed, 75 skipped, 12 files** (`artifact://1253`); all eight held-out configurations passed, totaling **38 passed, 22 skipped** (`artifact://1254`). CLI typecheck passed; Biome checked all **21 changed JSON files**, with no fixes. This sweep changed no scenario, clause, rubric, threshold, example or product code.

### Promoting disclosed checks to the visible suites (0095)

Agents/20 now loads the unchanged eight recordings from `architect/recordings/120/`; delivery/11 loads the unchanged five recordings from `roles/recordings/11/`. Their scenario objects moved into the respective visible `scenarios.json` files. Only number, ref and the quotation of the current delivery example changed during this relocation; clauses, rubrics, thresholds, prompts and history did not.

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/reconstitution
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
pnpm --filter cratylus typecheck
pnpm exec biome check \
  packages/cli/test/reconstitution/architect/scenarios.json \
  packages/cli/test/reconstitution/roles/scenarios.json \
  design/judgment/agents/reconstitution/architect/scenarios.json \
  design/judgment/delivery/reconstitution/roles/scenarios.json \
  packages/cli/test/reconstitution/architect/recordings/120 \
  packages/cli/test/reconstitution/roles/recordings/11
```

Observed after relocation: visible **244 passed, 83 skipped, 12 files** (`artifact://1274`); remaining held-out architect **5 passed, 4 skipped**. CLI typecheck and Biome on all **17 moved/changed JSON files** passed. The remaining held-out refs are `["held-out agents/2"]` for agents/architect and `[]` for delivery/roles. Per the lead's instruction, the latter scenario catalogue is left empty for the replacement writer: no placeholder assertion or ref prohibition was added, and its empty Vitest suite was not run or claimed green. Earlier evidence files retain the refs and commands actually exercised before promotion. No live model sessions ran.

## 0091: judged on what takes effect

`test/rubric-delivered.ts` projects retained messages into `{ delivered, heldDrift, relayed }`. Both architect and execution-role rubric prompts use only the delivered messages (and the architect's snapshots); they do not reintroduce a refused reply through the duplicate raw `report`. Refused calls and replies are not evidence for any clause. Ordinary tool errors and successful acts remain evidence, in order. No example, clause, rubric or threshold changed.

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

After the sibling guard change added an unseen-readback refusal and extended bottom-line's corrective instructions, this targeted regression command was run before updating the matcher:

```sh
pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts -t 'combined refusal|recognizes the generated'
```

Observed: **2 failed, 6 passed, 20 skipped**. The unseen-readback call remained in evidence, and a retained bottom-line refusal with the previous corrective instructions was no longer recognized. Readback matching now uses the shared leading request of both emitted variants; bottom-line matching reads its identifying first sentence from the canonical guard, not the changeable corrective instructions. The full acceptance command above then passed **6 files; 187 passed, 82 skipped**, with no model sessions.

#### Relayed tells are not refused replies

In `forge/src/adapters/omp/render.ts`, `guardJudged` calls `relay(reason)` and returns `undefined` once the turn's refusal allowance is exhausted. The stop handler only withdraws the reply and returns `decision: "block"` when a guard returns a reason. The relayed reply therefore stands: the relay is an unheld tell, not held drift under 0091. `relay` sends a next-turn user message attributed to `agent`; retained sessions mark it `steering: true`. The recordings below used the earlier one-refusal allowance, so their second stop was relayed. Round 6 allows two refusals before relaying: both `session-stop-continuation` messages still identify held attempts; only the later steering relay is unheld. The projection follows message shape, not a fixed stop count.

The projection keeps that reply and notice in delivered evidence. It separately reports `relayed: { guard, text, reason }[]`, also persisted in `recording.json` and `judged.json`, without adding to held-drift totals or manufacturing a rubric verdict. Only agent-attributed steering messages beginning with a turn guard's refusal identify these relays; ordinary user quotations, tool-guard text, and no-verdict notices do not. Consecutive guard relays can concern the same preceding reply.

`fixtures/heldout-workflow-3-relay.json` retains the final text reply (“Both decisions above stand…”) and its steering notice from `/tmp/heldout1/heldout-workflow-3/subject.json`, keeping model provenance and omitting thinking and usage metadata. The same shape was inspected in `/tmp/batch8/architect/visible/workflow/18/run-1/subject.json` and `/tmp/smoke12/workflow-18/subject.json` (message 37).

Seen red before changing the projection:

```sh
pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts -t 'second-stop relay|consecutive turn-guard relays'
```

Observed: **2 failed, 28 skipped** because `relayed` was absent, including on the real retained shape. After the projection change, persistence was independently **1 failed, 1 passed, 28 skipped**: the judged recording still lacked `relayed`. The checks also retain the reply in both rubric prompts, preserve raw subject evidence, and distinguish actual stop refusals from later unheld tells. The accounting assertion now includes both allowed refused replies before the relay.

After the relay and persistence changes, the full acceptance command above passed **6 files; 189 passed, 82 skipped**. `pnpm --filter cratylus typecheck` passed, and Biome checked the four changed TypeScript/JSON files. No live subject or judge sessions ran.

The same first-sentence rule now applies to descend and hand-back, so changing corrective instructions does not invalidate retained evidence. Regression cases cover descend's old tail, the new “Read the design instead…” tail, the imported refusal, and the identifying sentence alone; hand-back's identifying sentence is checked for both an actual refusal and a relay. Before the descend matcher change, sibling `ReconstitutionLead3.JudgeDelivered` observed **1 failed, 30 skipped** on `-t 'recognizes the generated descend gate'` (the new tail remained delivered). Before the hand-back matcher change, `-t 'recognizes hand-back refusals and relays independently'` was **1 failed, 34 skipped** (the refused reply remained delivered).

With all three canonical guard prefixes in place, the full acceptance command passed **6 files; 194 passed, 82 skipped**, CLI typecheck passed, and Biome checked all four changed TypeScript/JSON files.

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
