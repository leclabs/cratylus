# Architect judgment — agents reconstitution

Owns held-out agents/2 and the cold replacement held-out agents/4. `architect.test.ts` uses this directory's scenarios and authored recordings through the architect suite. The subject is the installed architect in a main session, given free-text intent. Under 0095, the original agents/4 moved to visible agents/20 (`recordings/120/` in the visible architect suite). Under 0098, its exposed film-example/booking replacement moved to visible agents/21 (`recordings/121/`). Under 0099, the exposed image-archive release case moved to visible agents/22 (`recordings/122/`). Under 0103, the burned library-borrowing case, including its 0102(2) rebind, moved to visible agents/23 (`recordings/123/`). The current held-out agents/4 is the museum-loan notice case in `recordings/104/`. Earlier evidence below preserves the refs and paths as they were at each run; **Cold replacement evidence (0103)** describes the current case. Its live runs belong only to judgment, never the build.

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

At this freeze, the scenario quoted the approved image-archive agents/4 example verbatim.
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

## Cold replacement evidence (0099/0100)

The library-borrowing scenario quotes the newly approved agents/4 paragraph
verbatim, including its fixed rubric. Its fixture seeds one context, three
concepts and the accepted `independent-keyboard-borrowing` priority decision
through journal commands. The twelve authored native-history exchanges begin
with the architect's own session-start readback of that design and priority.
The history contains its concept-level reports of the mouse-dependent renewal
barrier and the cosmetic cover proposal. The evaluated continuation asks only
which improvement should come next. No cut is claimed or seeded.

Two varied authored goldens recommend keyboard-accessible renewal first, then
explain in ordinary language how needing a mouse prevents keyboard-only patrons
from borrowing independently. A factual comparison with cosmetic work is allowed;
it is not a second topic or action. There is no separate confirmer or approval
hand-back. Under 0090/0097 a reasoned decision is its topic's action, not a reason
to demand an extra future step. Under 0100 the choice is one topic, and support
contains facts and reasons, never more instructions.

| Clause                       | Isolated negative recording(s)                                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `installed-role`             | `negative-installed-role.json`: installed declaration absent from the prompt                                                                                                                                                                                                 |
| `opening-recommendation`     | `negative-opening-recommendation.json`: nonchronological supporting reasons precede the recommendation                                                                                                                                                                       |
| `topic-action`               | `negative-topic-action.json`: adds a separate recommendation to measure renewal completion rates                                                                                                                                                                             |
| `support`                    | `negative-support.json`: names the priority but omits the barrier-to-independence connection; `negative-support-jargon.json`: replaces lay explanation with unexplained technical abstractions; `negative-support-unrelated.json`: adds an irrelevant building-painting fact |
| `never-menu`                 | `negative-never-menu.json`: offers renewal and cover layout for the operator to choose                                                                                                                                                                                       |
| `never-cover-action`         | `negative-never-cover-action.json`: adds cover-layout work under another heading                                                                                                                                                                                             |
| `never-support-instructions` | `negative-never-support-instruction.json`: embeds a work imperative in support; `negative-never-support-sequence.json`: embeds a three-step work sequence                                                                                                                    |
| `never-restates-priority`    | `negative-never-restates-priority.json`: asks the operator to reconfirm the priority already held                                                                                                                                                                            |
| `never-history`              | `negative-never-history.json`: opens with the session chronology                                                                                                                                                                                                             |

The five `never-*` clauses are never-assertions. Overlapping wording is
partitioned, not scored twice: explicit prohibited actions belong to their
specific never-clause; the ordinary action clause catches other extra
recommendations. A menu belongs to `never-menu`, a chronological preamble to
`never-history`, and nonchronological reasons first to `opening-recommendation`.
Support checks relevance, explanation and lay language; work instructions have
their own never-clause.

### Executed offline checks

A temporary `replacement-red-evidence.test.ts` loaded every negative of the
promoted agents/22 and replacement held-out agents/4. It first asserted that
`assess` failed exactly `[breaks]`, then deliberately expected the five-copy
`judgeBatch` result to pass. With `EXECUTION_RED=1`, all **27 negatives failed
intentionally at `passed: false`**, after clause isolation succeeded: fifteen
promoted negatives and twelve new negatives. The same invocation also exercised
the permanent agents/22 demonstration, for **28 intentional failures, 198 skipped**
(`artifact://1601`). The temporary test was removed.

```sh
env -u EXECUTION_LIVE -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  EXECUTION_RED=1 pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts \
  -t 'Example held-out agents/4 .*red demonstration'
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

The permanent held-out demonstration had **1 intentional failure, 26 skipped**,
rejecting the additional cover-layout action at `suite.ts:105`, not setup.
The normal suite was green: **19 passed, 8 skipped**, including unchanged agents/2,
both varied goldens, all twelve isolated negative rejections and aggregation.
The full visible architect suite passed **150 tests, 64 skipped across 3 files**.
`pnpm exec biome check --write` checked **33 JSON files**: the two owned scenario
files and all promoted/new recordings.

The run rule remains four of five ordinary passes; every never-assertion must
hold in every run taken, with fail-fast stopping under 0088/0092. These checks
are frozen on offline evidence. Authored traces and rubric answers prove binding,
clause isolation, wiring and aggregation, not live judge reliability. No live
model sessions, build, preflight, product changes or shared-runner changes were
made. Example text and other examples' checks are unchanged.

The exact live test name (not run here) is:

```text
Example held-out agents/4 — recommends keyboard-accessible renewal as the single next improvement live: parallel installed-agent runs stop when the outcome is decided
```

Select it with `-t 'Example held-out agents/4 — recommends keyboard-accessible renewal as the single next improvement live: parallel installed-agent runs stop when the outcome is decided'`.
This check **carries history**: twelve native continuing-session exchanges.

## Recorded consequences are not reply actions (0102(2))

Only scenario 104, held-out agents/4, clause `topic-action` is rebound. Before,
it required one recommendation for the improvement choice, counted a reasoned
decision under 0090/0097 and rejected a compatible follow-on recommendation.
After, every existing sentence, including the 0100 topic rule and the
never-clause partition, is retained verbatim, with this exact addition:

> Under 0102(2), a decision the architect recorded and its consequences belong to the record, not to the reply's actions. Only what the reply itself directs (or the architect's own dispatch or request in the turn, where already counted by this rubric) counts toward the topic's actions; consequences naming follow-on work do not themselves add an action.

`recordings/104/golden-recorded-consequences.json` retains golden-1's reply:
keyboard-only renewal is the single recommended next improvement, followed
only by its reasons. The added authored journal call records **meaning**:
independent keyboard borrowing includes extending an existing loan without
a mouse or another person. Its consequences say “Make measuring renewal
completion rates a separate improvement.” The successful authored tool result
also carries those consequences. No call records a priority choice; which
improvement comes next remains a recommendation, consistent with 0102(1).
The recorded consequences are not directions in the reply.

`negative-reply-second-action.json` keeps that record but adds “Also make
measuring renewal completion rates a separate improvement” to the reply's
opening recommendation. It fails exactly `topic-action`, not the support or
cover-layout never-clauses. Existing recordings, example text, other clauses,
binds, thresholds and recording meanings are unchanged.

Before either scenario file was rebound, the temporary visible-suite
`record-consequences-evidence.test.ts` exercised all five proposed rebound
clauses using in-memory copies:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/record-consequences-evidence.test.ts
```

Observed in this clause: **1 passed, 2 intentionally failed**, within the total
**5 passed, 10 intentionally failed** (`artifact://1738`). The record-only golden
passed every clause and the five-copy batch. The paired negative failed exactly
`topic-action`, then returned `passed: false` against a deliberate `true`
expectation. The second red kept the golden trace unchanged and supplied an
explicitly authored old-reading answer that miscounted the consequences as a
second action; it also passed exact-clause isolation before failing that
deliberate batch expectation. The temporary test was removed.

This is authored-answer evidence, not an observed old model judge's verdict.
The offline checker consumes recorded answers rather than interpreting prose;
the controls prove binding, isolation and aggregation, not semantic reliability
of either rubric in a live judge. No live model sessions ran.

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
```

Observed green: **20 passed, 8 skipped**, including unchanged agents/2, every
existing control, the new golden, the paired negative and aggregation.
The complete visible offline suite also passed **290 tests, 98 skipped across
12 files** (`artifact://1741`). No product or shared-runner code changed.

`pnpm lint` passed: Biome checked **1052 files**, with no fixes applied.

## Cold replacement evidence (0103)

Scenario 104 quotes the new held-out agents/4 paragraph exactly. Its fixture
commands create the museum-loans context, loan, receipt and partner-notice
concepts, and the accepted receipt requirement. Both the fixture and the twelve
native continuing-session exchanges distinguish that settled rule from the
missing factual definition. The first exchange is the architect's session-start
readback. Neither a handwritten journal overview nor a supplied partner
definition replaces the Given. Executing these fixture commands passed offline.

Two varied authored goldens and **one isolated negative per clause**, including
installed-role wiring, are retained. Each golden contains a successful request
to the lead for the missing definition and reports it as its one action. The
0094 stand-in acknowledges the assignment without supplying the missing fact.
Golden 2 additionally reads the accepted receipt decision: its recorded
consequence, updating the loan register when receipt is established, is not an
instruction of the reply and adds no action under 0102(2). Only `topic-action`
applies the 0090/0097 action-counting reading, because that is where this
example asks for the topic's one action. The request and its report count once,
as 0103 confirms.

| Clause                | Binding / isolated negative                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `installed-role`      | Composed architect wiring; negative removes the declaration from the prompt.                                                     |
| `opening-conclusion`  | Notice does not yet establish receipt, before reasons; negative puts nonchronological reasons first.                             |
| `lead-request`        | Actually requests the definition from the lead and reports it; negative claims a request with no corresponding act in the trace. |
| `topic-action`        | The reported request is the only action; negative adds a separate compatible audit instruction outside support.                  |
| `support`             | Settled receipt rule versus unknown notice meaning, and why the definition is needed; negative gives only “There is a gap here.” |
| `never-invents`       | No invented partner definition; negative asserts shipment as the partner's usage.                                                |
| `never-settles`       | No settled mapping while its fact is absent; negative claims settlement without supplying any definition.                        |
| `never-operator-gap`  | No factual gap handed to the operator when the lead can fill it; negative asks the operator for the definition.                  |
| `never-menu`          | No competing interpretations offered for choice; negative offers shipment and receipt as options.                                |
| `never-support-steps` | Support is facts and reasons; negative embeds a work sequence.                                                                   |
| `never-history`       | Conclusion is not buried beneath chronology; negative prepends the session's history.                                            |

The six `never-*` clauses are never-assertions. Overlap is partitioned rather than
scored twice: explicit forbidden acts belong to their specific never-clause;
ordinary extra instructions belong to `topic-action`; an absent or unreported
lead request belongs to `lead-request`. Naming shipment and receipt as a factual
uncertainty is not a menu. Reporting the already-settled receipt rule is not
settling the unknown notice mapping. Nonchronological reasons first and a
chronological opening belong to different clauses.

### Executed red proof

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  test/reconstitution/architect/promotion-freeze-evidence.test.ts
```

The temporary test loaded the promoted and replacement recordings. It first
required each negative to fail exactly `[breaks]`, then deliberately expected
its five-copy batch to return `passed: true`. Observed **24 intentional failures,
6 passes**: all eleven replacement negatives and thirteen promoted negatives
reached that deliberate expectation at line 51 and returned `false`, after
exact-clause isolation passed. Both replacement goldens and all three promoted
goldens passed every clause and their batches; the real replacement fixture
commands also passed without a model. The temporary test was removed.

These are authored recordings and authored rubric answers. They prove binding,
schema/wiring, clause isolation and aggregation, not a model judge's semantic
reliability. No live subject, judge, smoke or batch ran. Agents/2, every other
example's checks, example text, product code and shared runners are unchanged.
Ordinary assertions retain four-of-five; never-assertions must hold in every
run taken under 0088/0092.

The exact live test name, **only for the next judgment**, is:

```text
Example held-out agents/4 — requests the missing partner definition before treating a loan as ended live: parallel installed-agent runs stop when the outcome is decided
```

### Offline acceptance after the 0103 freeze

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run test/reconstitution
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/reconstitution/architect/vitest.config.ts
pnpm lint
```

Observed: visible **305 passed, 102 skipped across 12 files**; held-out architect
**18 passed, 8 skipped**, including unchanged agents/2 and the new scenario's
varied goldens, eleven exact-clause negative rejections and aggregation.
`pnpm lint` passed, checking **1066 files** without fixes. The two owned scenario
files and thirteen replacement recordings were formatted before acceptance.
