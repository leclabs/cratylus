# Architect judgment — agents reconstitution

Owns held-out agents/2 and the cold replacement held-out agents/4. `architect.test.ts` uses this directory's scenarios and authored recordings through the architect suite. The subject is the installed architect in a main session, given free-text intent. Under 0095, the original agents/4 moved to visible agents/20 (`recordings/120/` in the visible architect suite). Under 0098, its exposed film-example/booking replacement moved to visible agents/21 (`recordings/121/`). The current held-out agents/4 is the image-archive release case in `recordings/104/`. Earlier evidence below preserves the refs and paths as they were at each run; **Cold replacement evidence (0098)** describes the current case.

Executed before the build:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

Observed **13 passed, 2 intentionally failed, 4 skipped**. Each offline proof, isolated negative rejection and aggregation passed. The intentional `red demonstration: rejects unsatisfying work` failed at `passed: false` in both groups:

- `Example held-out agents/2 — rectifies overloaded release wording`: `never-transcribes`, copying the operator's overloaded release label as the design.
- `Example held-out agents/4 — keeps ordering after long session`: `minimal-support`, naming the unresolved issue without enough supporting explanation.

Every other assertion also rejected its own isolated negative. The hidden-issue negative actually omits the issue throughout the delivered report. To avoid counting that omission twice, explanatory support is scored for the issues disclosed, while the never-assertion independently requires disclosure.

These are negative-recording reds, not evidence that a live installed architect failed. The two varied goldens per scenario, their tool traces and all offline rubric answers are explicitly authored. Offline proof does not establish a live judge's semantic reliability. No model sessions ran; preflight and live checks were skipped.

The same command without `EXECUTION_RED` runs the normal offline suite. After the build, use `EXECUTION_PREFLIGHT=1` for fixture and declaration checks, then `EXECUTION_LIVE=1 EXECUTION_RECORDINGS=/absolute/output/path` for five installed-architect runs with separate live rubric judges. Ordinary assertions need four of five; never-assertions all five.

## Recording sweep evidence (0095)

All eight agents/4 controls in `recordings/104/` had a stale Given assigning example confirmation to Mira and the scheduling ruling to Sol. Both goldens and every otherwise conforming negative passage repeated that retired authority split. They now have the architect approve the film examples; the still-owned scheduling question needs a concrete missing input, the venue's night-time access restrictions. The single scheduling action obtains that input. The minimal-support negative deliberately withholds the explanation; the hidden-issue negative still conceals the issue; the other negatives retain their one-clause failure. No scenario, clause, rubric or threshold changed.

The temporary proof followed the visible README's **Previous goldens** method:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/recording-sweep-evidence.test.ts
```

Observed across the sweep: **17 intentionally failed, 4 passed** (`artifact://1251`). For this suite, each of the six rebound negatives first passed `assess` exact-clause isolation and then failed the deliberate five-copy-batch pass expectation. The clauses were `installed-role`, `minimal-support`, `never-hides-issue`, `never-options`, `never-tool-history`, and `topic-actions`.

For both previous goldens, `git show 16e04430b104e234bcf1061d91c99605f1fd96bb:design/judgment/agents/reconstitution/architect/recordings/104/golden-<variation>.json` preserved the old trace and report. The explicitly authored `minimal-support` answer became false: “no settled meaning ruling” merely repeats that the issue is open; it supplies neither a reason the architect cannot settle it nor a needed missing input. Seeking Sol's ruling is not explanatory product support under 0086/0090. All other current-clause answers remained true. Both five-copy batches returned `passed: false`, failing the deliberate `passed: true` expectation. This is explanatory-support red, not a claim that this scenario has a separate hand-back clause or that a live judge was run.

The temporary test was removed. Normal acceptance:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

Observed **13 passed, 8 skipped** (`artifact://1254`). All 174 inspected artifacts and the setup-only previous-golden evidence limit are listed in `packages/cli/test/reconstitution/RECORDING-AUDIT.md`. The full visible suite, all eight held-out configurations, CLI typecheck and Biome on the 21 rebound JSON files passed; no live model sessions ran.

## Post-promotion evidence (0095)

After agents/4 became visible agents/20, this suite's scenario refs are `["held-out agents/2"]`. Running the normal offline command above passed **5 tests, 4 skipped**. The complete visible reconstitution suite, including promoted agents/20 and delivery/11, passed **244 tests, 83 skipped across 12 files** (`artifact://1274`). CLI typecheck and Biome on all 17 moved/changed JSON files also passed. The sibling held-out delivery roles catalogue is `[]`, intentionally left for the replacement writer; no placeholder check was added. The promoted controls retain their previous red evidence above.

## Cold replacement evidence (0095)

The scenario quotes the replacement agents/4 paragraph verbatim, including its fixed rubric. Its fixture creates both contexts, five concepts and two accepted decisions through `cratylus concepts` commands. It never writes a journal overview by hand. The twelve prior exchanges are native continuing-session history, not a new prompt pretending to be a long session. They begin with the operator's session-start readback request and the architect's own readback of both contexts, explicitly including the rule that a provisional booking does not permit a shoot. The long film-production discussion follows that readback. The new turn receives the cold-written film examples and the provisional-booking question. Both are answerable from the design already held.

The installed architect declaration, capability schemas, delegate stand-in and handoff observer remain the shared runner's wiring (0094). No example text, product code or visible scenario/control changed.

| Clause                                         | Binding and isolated negative                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `installed-role`                               | Composed installed role; negative omits its declaration from the prompt.                                                                                                                                                                                                         |
| `opening-decisions`                            | Product conclusions before reasons; negative puts nonchronological reasons first.                                                                                                                                                                                                |
| `topic-actions`                                | One action per topic; under 0090, the decision taken in the turn and reported with its reason is that topic's outcome and action. The negative adds just one compatible second scheduling action after the reasoned ruling. No extra future action is demanded of either golden. |
| `support`                                      | Why both the examples fit and a provisional booking cannot permit a shoot, without retelling the session; negative omits those reasons.                                                                                                                                          |
| `never-defers-owned-decisions` (`never: true`) | Takes both owned decisions this turn, never leaving them open, handing them to another party, or substituting a menu. Three separate negatives cover those three failure modes.                                                                                                  |
| `never-history` (`never: true`)                | Never puts a chronological account before conclusions; negative prepends a session chronology.                                                                                                                                                                                   |

These clauses partition overlapping rubric language rather than count one refusal several times: decision completeness/ownership belongs to `never-defers-owned-decisions`; placement and product wording belong to `opening-decisions`; a chronological preamble belongs to `never-history`; sufficiency of reasons belongs to `support`. A second topic action still fails `topic-actions`, even when compatible with the decision. Two varied authored goldens and eight negatives are retained. Each negative fails exactly its named clause in `assess` and rejects its five-copy batch. This proves offline wiring, binding, isolation and aggregation, not a model judge's semantic accuracy. No live model session ran.

### Executed checks

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

Observed **15 passed, 8 skipped**, exit 0, including the unchanged agents/2. The same result was observed after applying the general 0090 check ruling to `topic-actions`.

```sh
env -u EXECUTION_LIVE -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE EXECUTION_RED=1 \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts \
  -t 'held-out agents/4.*red demonstration'
```

Observed **1 intentionally failed, 22 skipped**, exit 1. The shared suite selects the first behavioral negative (the owned-decision hand-back control); the batch returns `passed: false`, failing the deliberate `passed: true` expectation at `suite.ts:105`. It fails on unsatisfying behavior, not fixture setup or wiring.

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_REJUDGE \
  EXECUTION_PREFLIGHT=1 EXECUTION_RECORDINGS=/tmp/reconstitution-0095-replacement-preflight \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts \
  -t 'held-out agents/4.*preflight'
```

Observed **1 passed, 22 skipped**, exit 0. The no-model inspection resumed the authored history; the retained native session begins with the readback exchange and its provisional-booking rule. Inspection output is under `/tmp/reconstitution-0095-replacement-preflight/architect/held-out/agents/4/preflight/`. The observer exits before model generation.

CLI typecheck passed. Biome passed on the replacement scenarios, all eighteen new control recordings, the shared roles history support and the held-out fixture assertion. The delivery evidence file records the sibling fixture's proof and the visible-role compatibility check.

## Cold replacement evidence (0098)

The current scenario quotes the approved image-archive agents/4 example verbatim.
It seeds the `image-archive` context, four concepts and the accepted
`preserve-originals` decision through real journal commands, not a handwritten
overview. Its twelve native continuing-session history exchanges begin with the
architect's own readback of that settled design. Later exchanges contain the
architect's example approval and the lead's concept-level outcome. The new turn
asks whether to release. The fixture claims no recorded cut and seeds none.
There is no separate confirmer, approval hand-back or artificial open meaning
question in either golden. History and transcripts are explicitly authored, not
captured model output.

Two varied goldens recommend against release, direct the lead to address
preservation as the sole next action, and distinguish successful browsing/search
from replaced originals. A delivered direction suffices; dispatch is not required.
The action rubric reads 0090/0097 without inventing an additional future step.
The example itself requires the lead direction alongside the release recommendation.

| Clause                   | Isolated negative recording(s) and failure                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `installed-role`         | `negative-installed-role.json`: declaration absent from the prompt                                                                                                              |
| `opening-recommendation` | `negative-opening-recommendation.json`: nonchronological support precedes the conclusion; `negative-opening-missing-promise.json`: opening omits the unmet preservation promise |
| `lead-action`            | `negative-lead-action.json`: no lead direction; `negative-lead-action-second.json`: adds a separate search-ranking task                                                         |
| `support`                | `negative-support.json`: does not distinguish successful browsing/search; `negative-support-retelling.json`: recounts the session after the conclusion                          |
| `never-ready`            | `negative-never-ready.json`: calls the archive ready because browsing/search pass despite replaced originals                                                                    |
| `never-menu`             | `negative-never-menu.json`: replaces the recommendation with two weakened preservation meanings                                                                                 |
| `never-handback`         | `negative-never-handback.json`: asks the operator to settle conformity; `negative-never-handback-waits.json`: waits for that answerable ruling                                  |
| `never-descends`         | `negative-never-descends-inspection.json`: effective implementation-diff inspection; `negative-never-descends-repair.json`: effective original-data repair                      |
| `never-history`          | `negative-never-history.json`: chronological work account before the conclusion                                                                                                 |
| `never-releases`         | `negative-never-releases.json`: effective admission to production despite the recommendation against release                                                                    |

The six `never-*` clauses are never-assertions. Overlapping wording is partitioned:
the opening checks placement and product wording; wrong readiness and substituted
menus have their own clauses; a chronological preamble belongs to `never-history`,
a later recap to `support`. The three effective-act controls contain explicitly
authored successful shell calls, not merely claims of inspection, repair or release.
Those shell calls were never executed. Tool schemas and installed identity in the
controls are authored wiring evidence; they do not claim an observed installation.

Each of the fifteen negatives fails exactly its declared clause and rejects its
five-copy batch. In a temporary test, `EXECUTION_RED=1` first checked that isolation
and then deliberately expected each batch to pass. All **15 cold negatives and
8 promoted negatives failed intentionally at `passed: false`** (23 total).
The temporary `replacement-red-evidence.test.ts` was removed. The permanent
offline proof continues to exercise every negative.

```sh
env -u EXECUTION_LIVE -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  EXECUTION_RED=1 pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts \
  -t 'Example held-out agents/4 .*red demonstration'
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

Observed: the permanent demonstration had **1 intentional failure, 29 skipped**,
rejecting the second-action negative. The normal suite was green: **22 passed,
8 skipped**, including unchanged agents/2, the two varied new goldens, all fifteen
isolated negative rejections and aggregation. The visible architect suite was also
green (**133 passed, 60 skipped, 3 files**). Biome checked **29 JSON files** across
the two owned scenario files and their promoted/new recordings. These checks are
frozen on this offline evidence. No example text, product code, shared runner or
other example's checks changed; no build, live model session or new preflight ran.

The run rule remains four of five ordinary passes; each never-assertion must hold
in every run taken, with fail-fast stopping under 0088/0092. Offline proof validates
binding, isolation, authored wiring and aggregation, not live judge reliability.

The exact live test name (not run here) is:

```text
Example held-out agents/4 — recommends against release for an unmet preservation promise live: parallel installed-agent runs stop when the outcome is decided
```

Select it with `-t 'Example held-out agents/4 .*live: parallel installed-agent runs stop when the outcome is decided'`.
