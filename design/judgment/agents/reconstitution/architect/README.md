# Architect judgment — agents reconstitution

This suite owns held-out agents/2: rectifying overloaded release wording. `architect.test.ts` uses this directory's scenario and authored recordings through the shared architect suite. The subject is the installed architect in a main session, given free-text intent. Its scenario, clauses, rubrics, controls and thresholds are unchanged.

## Reply-guard checks moved to cut 7 (0106)

Held-out agents/4 (scenario 104), its thirteen recordings, and its dedicated documentation are parked unchanged on branch `cut-7/reply-guards` (at `eea6a7d3`). They are removed from this branch, not skipped or weakened. Earlier exposed versions now numbered visible agents/20–23 leave with the visible reply-guard scenarios. No text under `design/examples/` changes.

Decision 0106 supersedes 0091's treatment of replies: a turn-end refusal cannot undo a reply already shown. Shared architect and roles judgment keeps the refused reply and its rewrite delivered. Held drift is only refused pre-act attempts, including readback, descend, past-objective and dispatch checks.

The shared rebound check was seen red before changing delivered-evidence logic:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/rubric-judge.test.ts \
  -t '0106 keeps the refused reply'
```

Observed **1 failed, 39 skipped**, exit 1 (`artifact://1901`): the old actual rubric prompt omitted the refused reply from a retained recording followed by a rewrite. The permanent check requires both replies in architect and execution-role rubric prompts. This is offline evidence projection proof, not a model judge's semantic verdict. The visible architect README details persistence and held-drift accounting.

## Remaining check's red evidence

Before the build, this suite's `EXECUTION_RED=1` run rejected the held-out agents/2 `never-transcribes` negative: copying the operator's overloaded release label as the design. Its intentional demonstration received `passed: false`, not a fixture/import failure. Every other assertion also rejected its isolated negative. After the original agents/4 promotion under 0095, the agents/2-only offline suite passed **5 tests, 4 skipped** (`artifact://1274`). Those are historical observations, not a new live verdict.

The two varied goldens and negative recordings have explicitly authored traces and rubric answers. Offline proof validates binding, isolated failures, wiring and aggregation, not live judge reliability. Under 0088/0092, ordinary assertions require four passing runs of five, and never-assertions hold in every run taken; batches stop when decided. Held-out behavioral runs belong only in judgment under 0103.

## Offline command

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

No live subject, model judge, smoke, batch or preflight was run for the 0106 split.

## Offline acceptance after 0106

Against package artifacts rebuilt by the successful `pnpm typecheck:test` (**9/9 tasks**), this suite passed **5 tests, 4 skipped**. All eight held-out suites passed **36 tests, 23 skipped** in total. The full CLI suite passed **532 tests, 83 skipped**; `pnpm lint` passed on **933 files** with no fixes. The visible architect README records the commands and full per-suite counts. No live model session ran.
