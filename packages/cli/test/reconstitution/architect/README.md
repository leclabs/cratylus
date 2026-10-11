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

Agents/11's hand-back guard check (`../binding/guard.test.ts`), the shared owned-question judgment test and held-out agents/4 (scenario 104) also leave this cut. No example text under `design/examples/` changes. The catalog values remain; only the turn-end guard realization and the checks held only by it leave. Readback, descend, past-objective and pre-act dispatch checks stay.

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

`test/rubric-delivered.ts` projects retained messages into `{ delivered, heldDrift, relayed }`. Both architect and execution-role rubric prompts use the delivered messages; the duplicate final `report` is omitted. A reply has already reached its reader when a turn-end refusal arrives. Both the refused reply and its rewrite remain delivered, in order, including string and block replies and replies sharing a message with successful calls. The judge instructions explicitly require judging both.

Only matched tool calls refused before taking effect are removed. Readback, descend, past-objective and dispatch refusals remain held drift; ordinary errors, successful calls and quoted refusal text remain delivered. One jointly refused call counts once overall and once for each refusing guard. Historical reply entries in retained held-drift metadata are not counted.

`subject.json` and raw messages remain intact. Judged recordings persist held drift separately from verdicts, and `assessment.json` reports it per run and overall, including returned siblings not consumed by fail-fast. Historical agent-attributed steering notices may still be reported as `relayed` diagnostics, but never withdraw replies or add held drift. Their historical text is fixture evidence, not a live guard definition or compatibility export.

The transcript fixture `fixtures/agents-13.json` remains solely as a delivery/accounting regression, not as the moved agents/13 behavioral scenario. It retains three refused pre-act calls, successful calls, a refused reply and a rewrite from `/tmp/smoke11/agents-13/subject.json`. `workflow-31.json` and `agents-16.json` retain pre-act refusal excerpts. `heldout-workflow-3-relay.json` retains a reply and historical steering notice from `/tmp/heldout1/heldout-workflow-3/subject.json`. These are existing transcript controls, not new model runs.

### Rebound logic seen red first

Before changing the projection, ran:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts \
  -t '0106 keeps the refused reply'
```

Observed **1 failed, 39 skipped**, exit 1 (`artifact://1901`). The old projection omitted “so I won't settle it without your intent” from the architect's actual rubric prompt, although it retained the rewrite “Scheduling allows night shoots.” The permanent rebound check requires both in architect and execution-role prompts. Other regression checks cover delivery order, no subject mutation, persistence, mixed string/block messages, consecutive historical notices, pre-act isolation and batch accounting. No model judge was called; this proves the evidence sent for judgment, not semantic model reliability.

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
