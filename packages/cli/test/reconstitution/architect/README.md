# Architect behavioral checks — reconstitution

These checks bind workflow examples 18, 19, 20, 23, 31 and agents examples 12–19. The scenario reference, quoted example, and each assertion's `binds` phrases are in `scenarios.json`.

## Evaluation

The subject is the **installed architect**, launched as a main session with `omp --agent architect`. Its assignment is free-text intent, as the realization contract requires; there is no invented architect assignment schema. Delegated lead assignments in the controls use the contract's fenced `assignment` JSON.

Each fixture has its own repository and home. CLI commands seed real journal and ledger records; no handwritten overview substitutes for the computed one. Only the status/reconstitution cases seed in-flight work. The passive task observer records the checked-out branch at handoff without changing or refusing the act.

Agents/17 runs three turns by resuming one native session, so later turns receive the architect's actual earlier answers.

The suite follows `execution-roles`: two varied authored golden recordings per example; one negative per assertion (including wiring); offline clause-isolation and host-read proof; five-run aggregation with ordinary assertions at least four of five and never-assertions five of five. Recorded rubric answers are deliberately authored controls, **not live judgments or captured model goldens**. The offline proof validates the binding and aggregation, not the semantic reliability of a model judge. A live run uses a separate, test-owned, untyped `rubric-judge` session, because the workflow assayer now has a different typed assignment and return contract. The default judge model is `anthropic/claude-opus-5-5`, overridable with `EXECUTION_JUDGE_MODEL`.

Private self-checking is not observable. The drift checks judge the acts on every turn, not a self-check declaration.

## Observed red evidence

Executed once before the build:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
```

Observed: **87 passed, 13 intentionally failed, 26 skipped**. Every offline proof, every individual negative-rejection check and every aggregation check passed. Each example's `red demonstration: rejects unsatisfying work` failed because the selected deliberately unsatisfying recording returned `passed: false`, not because of an import or fixture error. The 26 skipped tests are no-model preflight and live execution, neither requested here.

| Example     | Test group                                 | Selected negative in the intentional red demonstration                   |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| workflow/18 | overview before readback before action     | `needed-detail`: no needed decision/ledger detail queried                |
| workflow/19 | separates meanings and seeks confirmations | `confirm-holders`: scheduling holder's confirmation omitted              |
| workflow/20 | settles delegate meaning from design       | `never-handback`: returns the answerable ruling to the operator          |
| workflow/23 | bottom line and one action per topic       | `conclusion-first`: supporting facts precede the conclusion              |
| workflow/31 | checks out named branch before dispatch    | `checkout-first`: checkout follows dispatch                              |
| agents/12   | answers status without permission-seeking  | `never-read-permission`: asks permission to read the available ledger    |
| agents/13   | owns settled meaning ruling                | `decides-reason`: describes the distinction but issues no ruling         |
| agents/14   | recommends established expression          | `never-menu`: substitutes a menu for its recommendation                  |
| agents/15   | resolves failure above implementation      | `design-and-delegate`: does not delegate realization of the failing case |
| agents/16   | stops when objective achieved              | `never-extra-round`: invents an unnecessary round                        |
| agents/17   | holds stance across three actual turns     | `later-ruling`: a later turn omits the ruling                            |
| agents/18   | bottom-line ordering for two topics        | `exactly-one-action`: omits the scheduling action                        |
| agents/19   | delegates intent not branching procedure   | `intent-concepts-acceptance`: handoff omits concepts and acceptance      |

These are negative-fixture reds; no claim is made that today's installed architect was observed failing or passing live. Every other assertion also rejected its own isolated negative in a `seen red: <assertion>` test.

## Lead commands

The normal package test inclusion already discovers `architect.test.ts`. Without `EXECUTION_RED`, intentional failure demonstrations stay skipped.

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_PREFLIGHT=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
EXECUTION_LIVE=1 EXECUTION_RECORDINGS=/absolute/output/path pnpm --filter cratylus exec vitest run test/reconstitution/architect/architect.test.ts
```

Live execution is opt-in, five installed-agent runs per example, after the build supplies the contract's new journal/ledger commands. No live model sessions or repository-wide checks were run by this check-writer.

## Prompt transport and retained-subject re-judgment

Both subject and rubric-judge prompts are written verbatim to each launch's `prompt.txt` and passed through omp's documented `@file` input. Only the filename enters argv, so a large trace does not hit the operating system's per-argument size limit.

Under `EXECUTION_RECORDINGS`, this suite writes `architect/visible/<context>/<example>/`. Other suites' numeric example directories cannot collide with these paths. Each new run preserves `subject.json` and the native session before starting its judge.

`EXECUTION_REJUDGE` selects retained subjects instead of launching architects. It still requires `EXECUTION_LIVE=1` for the separate judges. The destination must be outside the retained input tree; the source is only read. Re-judgment keeps the original clauses, rubrics and five-run thresholds. For older runs lacking `subject.json`, it reconstructs the subject from all required `turn-N/recording.json` files, checks architect wiring, and ignores the collision-prone top-level `recording.json`. Missing turns refuse re-judgment rather than silently narrowing its evidence.

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
