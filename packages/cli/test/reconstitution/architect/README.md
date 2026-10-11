# Architect behavioral checks — reconstitution

These checks bind workflow/18, workflow/19, workflow/31 and agents/12, agents/15, agents/16, agents/19. Their scenario objects, quoted examples, clauses, rubrics, controls and thresholds are unchanged by the 0106 split.

## Reply-guard checks moved to cut 7 (0106)

The following scenarios, their recordings and their dedicated checks and documentation are parked unchanged on branch `cut-7/reply-guards` (at `eea6a7d3`), not run by this cut:

| Examples                                   | Scenario numbers   |
| ------------------------------------------ | ------------------ |
| workflow/20, workflow/23                   | 20, 23             |
| agents/13, agents/14                       | 113, 114           |
| agents/17, agents/18                       | 117, 118           |
| agents/20, agents/21, agents/22, agents/23 | 120, 121, 122, 123 |

Agents/11's hand-back guard check (`../binding/guard.test.ts`), the shared owned-question judgment test and held-out agents/4 (scenario 104) also leave this cut. Under 0106, the moved examples' text now lives in `design/examples/{workflow,agents}/cut-7.md`, unchanged in meaning; the burned held-out agents/4 is visible there as agents/24. The catalog values remain; only the turn-end guard realization and the checks held only by it leave. Readback, descend, past-objective and pre-act dispatch checks stay.

## Evaluation

The subject is the installed architect, launched as a main session with `omp --agent architect`, with free-text intent rather than an invented assignment schema. Delegate assignments use the contract's fenced `assignment` JSON.

Each fixture has its own repository and home. CLI commands seed real journal and ledger records, not handwritten overviews. Only status/reconstitution cases seed in-flight work. The passive task observer records the checked-out branch without changing or refusing the act.

Subjects exclude host extension discovery and explicitly load the installed JavaScript/TypeScript extensions, including `cratylus-session.ts`, before the passive observers. Rubric judges load only the installed adapter and observers, not subject session guards. No-model preflight checks installed declaration/tool composition and the first-turn reconstitution note when applicable.

Under 0094, `delegate-stand-in.ts` accepts subject dispatches and returns the same fixed acknowledgement for each assignment. It starts no child or live model session, claims no work completed, preserves native task activation/schema/description, and does not introduce an unavailable task tool. Pre-act guards and the passive observer still see the original call. Offline scripted-transport tests prove exposed task routing, acknowledgement, retained inputs and branch, and the absence of child requests. The dedicated workflow/23 ordering assertion moved with that scenario; routing checks remain.

Two varied authored goldens per example and isolated negatives prove wiring, clause binding and aggregation. Authored rubric answers are not captured live judgments and do not prove a model judge's semantic reliability. A separate untyped rubric-judge session uses `EXECUTION_JUDGE_MODEL`, otherwise the host's `frontier-other-family` role. Private self-checking is not observable; checks judge acts, not declarations of self-checking.

Under 0088/0092, batches stop when frozen assertions decide the outcome: four passes of every ordinary assertion pass, two failures of one ordinary assertion fail, and any never-assertion violation fails immediately. Outstanding sessions are cancelled, not fabricated as judged. One judge-only retry is allowed for an unjudged retained subject; missing evidence remains unjudged/incomplete unless the outcome is already decided. Assessment reports include runs spent and cancellations. Smoke/sample selection precedes any live batch; no live run was made for the 0106 change.

## Retained red evidence for remaining examples

Before the 0086/0087 build, the architect suite's intentional-red demonstrations failed at `passed: false`, not at fixture setup or imports. These remaining examples selected:

| Example     | Selected isolated negative                                          |
| ----------- | ------------------------------------------------------------------- |
| workflow/18 | `needed-detail`: needed decision/ledger detail not queried          |
| workflow/19 | `approves-examples`: one owned context left undecided               |
| workflow/31 | `checkout-first`: checkout follows dispatch                         |
| agents/12   | `never-read-permission`: asks permission for the available ledger   |
| agents/15   | `design-and-delegate`: omits delegation of realization              |
| agents/16   | `never-extra-round`: repeats already-passing checks                 |
| agents/19   | `intent-concepts-acceptance`: handoff omits concepts and acceptance |

The original command was `EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts`. Its historical total covered moved examples too; no new behavioral verdict is claimed by removing them.

Under 0086/0087, workflow/19 gives the architect both contexts and the illustrator's examples to approve itself. Scenario setup uses `--architect`, not a separate meaning-holder. Both previous workflow/19 goldens failed `approves-examples` and `never-confirm-other` in authored-answer five-copy batches. Setup evidence failed at the then-missing `--architect` option; those were real fixture command failures, not model failures.

Under 0089, agents/16's continuing history supplies the architect's earlier readback and approval. Its `negative-continuing-discovery.json` rejects renewed discovery after the completed outcome, not reconstitution at a fresh start. Workflow/31 and agents/19 likewise supply readback and approval without claiming checkout or dispatch happened. Their two selected red demonstrations returned `passed: false`; their two no-model preflights passed. No clauses, prompts, examples or thresholds changed in this setup rebind.

The 0095 recording sweep made the workflow/31 and agents/19 controls begin with the architect's approval, not a separate confirmer. All eight visible negatives for these examples passed exact-clause isolation then failed deliberate batch-pass assertions. Their four previous goldens still satisfied dispatch clauses; no red was claimed for setup-only defects. See `../RECORDING-AUDIT.md` for the historical audit's retained rows.

## Delivered evidence and held drift (0106)

`test/rubric-delivered.ts` projects retained messages into `{ delivered, heldDrift }`. Both architect and execution-role rubric prompts use the delivered messages; the duplicate final `report` is omitted. Every shown reply remains delivered, in order, including string and block replies and replies sharing a message with successful calls. Synthetic tests preserve 0106(2): a later refusal cannot withdraw any reply. The judge instructions require judging all replies.

Only matched tool calls refused before taking effect are removed. Readback, descend, past-objective and dispatch refusals remain held drift; ordinary errors, successful calls and quoted refusal text remain delivered. One jointly refused call counts once overall and once for each refusing guard. Historical reply entries in retained held-drift metadata are not counted.

`subject.json` and raw messages remain intact. Judged recordings persist held drift separately from verdicts, and `assessment.json` reports it per run and overall, including returned siblings not consumed by fail-fast. Reply-guard recognition and the `relayed` diagnostic have been removed; new judged recordings contain no such field.

The agents/13 reply-refusal transcript and held-out workflow/3 relay transcript have been removed from the visible fixture tree. Delivery, readback accounting, prompt projection and persistence tests use synthetic evidence, not those runs. `fixtures/workflow-31.json` and `fixtures/agents-16.json` remain as additional retained pre-act refusal controls; synthetic controls independently exercise readback, descend, past-objective and all dispatch gates.

### Rebound logic seen red first

Before the original 0106 projection change, ran:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts \
  -t '0106 keeps the refused reply'
```

Observed **1 failed, 39 skipped**, exit 1 (`artifact://1901`). The old projection omitted the refused reply from the architect's actual rubric prompt while retaining its rewrite. That historical check has been replaced by synthetic evidence requiring every shown reply in both architect and execution-role prompts. Other regression checks cover delivery order, no subject mutation, persistence without reply diagnostics, mixed string/block messages, pre-act isolation and batch accounting. No model judge was called; this proves the evidence sent for judgment, not semantic model reliability.

Before removing the harness remnants, the synthetic `0106 delivered evidence` checks ran against the old harness: **17 failed, 4 passed, 11 skipped**, exit 1 (`artifact://2024`). The failures identified the obsolete `relayed` projection field and its persistence in judged recordings, not fixture setup or model transport. The second-stop relay and guard-specific reply diagnostic checks are no longer part of this cut.

## Native history, prompt transport and replay

Continuing-session fixtures resume native history, not instructions embedded in a fresh prompt. The passive observer records the installed model's provider, ID and API; native history includes that identity in model-change and assistant entries. Missing model observation refuses construction. Live credentials are copied before the initial inspection. Neither initial nor resumed preflight overrides the model. Offline regressions cover restoration and incomplete metadata.

Both subject and judge prompts go verbatim into `prompt.txt` and use omp's `@file` argument, avoiding argv-size limits. Output paths are `architect/visible/<context>/<example>/` (or `architect/held-out/…`), so other suites cannot collide. Every run retains `subject.json` and its native session before judging.

`EXECUTION_REJUDGE` reads retained subjects without launching architects; `EXECUTION_LIVE=1` is still required to authorize separate model judges. Output must be outside the input tree. For older recordings without `subject.json`, replay reconstructs all required `turn-N/recording.json` files, verifies wiring, and ignores the collision-prone top-level recording. `EXECUTION_REJUDGE_LEGACY=1` selects the old numeric layout. A single smoke is not four independent passing runs: missing runs remain unjudged, never duplicated to manufacture a passing batch.

## Commands

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
```

The second command intentionally fails on unsatisfying controls. Preflight and live/rejudge modes are opt-in; neither was run for this split. Offline acceptance for 0106 comprises all CLI tests, all eight held-out reconstitution configurations, `pnpm typecheck:test` and `pnpm lint`.

### Offline acceptance after the split

After the product removals landed, `pnpm typecheck:test` rebuilt all package artifacts and passed **9/9 tasks**. Because the fixture packs `dist` without building it, CLI and held-out acceptance were repeated against those observed fresh artifacts rather than relying on the earlier green runs.

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  -u BINDING_RED pnpm --filter cratylus exec vitest run test/
# Each of the eight design/judgment/*/reconstitution/*/vitest.config.ts files:
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  -u BINDING_RED pnpm --filter cratylus exec vitest run --config ../../<path>
pnpm typecheck:test
pnpm lint
```

Observed: CLI **532 passed, 83 skipped; 37 files passed, 1 skipped** (`artifact://1954`), including all 40 rubric-judge and 12 rubric-batch tests. All eight held-out suites passed:

| Held-out configuration | Passed | Skipped |
| ---------------------- | -----: | ------: |
| agents / architect     |      5 |       4 |
| workflow / architect   |      6 |       4 |
| agents / binding       |      1 |       0 |
| delivery / delivery    |      1 |       0 |
| workflow / overview    |      1 |       0 |
| workflow / ledger      |      4 |       0 |
| agents / roles         |      7 |       6 |
| delivery / roles       |     11 |       9 |
| **Total**              | **36** |  **23** |

`pnpm lint` passed, checking **933 files** without fixes. Typecheck, lint and all tests exited 0. Intentional-red, model, preflight and rejudge modes were disabled for acceptance; no live model session ran.

### Offline acceptance after harness-remnant removal

The same offline commands above passed after removing the reply diagnostics and replacing the two obsolete transcript fixtures with synthetic evidence. `pnpm typecheck:test` passed **9/9 tasks**, rebuilding the package artifacts before the suites ran. CLI acceptance passed **524 tests, 83 skipped; 37 files passed, 1 skipped** (`artifact://2028`), including all **32 rubric-judge** and **12 rubric-batch** tests. The eight held-out suites passed with the same per-suite counts in the table above: **36 passed, 23 skipped**, each command exiting 0. `pnpm lint` passed on **931 files**, with no fixes. No live model session, preflight or rejudge ran.
