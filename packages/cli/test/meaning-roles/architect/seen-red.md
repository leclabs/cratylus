# meaning-roles: architect checks seen red

These checks bind workflow/20, workflow/23 and agents/11, /13, /14, /17,
/18, /20–29 in the approved meaning-roles examples. No example clause remains
unbound. No meaning question was needed. No implementation or shared judging
harness file was changed.

## Binding and reuse

`scenarios.json` carries the current example text and each clause's verbatim
binding. `architect.test.ts` uses the existing installed architect runner,
continuing native sessions, retained subject recordings, independent rubric
judge, four-of-five aggregation and every-run never-assertions. `smoke.ts`
provides the separate concurrent one-run-per-example smoke stage of 0088;
a failed smoke returns to build, not to a batch.

The parked controls were read from `cut-7/reply-guards`. Their provenance names
the original file. Workflow recordings 20 and 23 and agents recordings 113,
114, 117, 118, 120–123 were reused. Former held-out recording 104 is now visible
recording 124 for agents/24. No reply guard or reply-guard implementation was
restored. Historical refusal text occurs only as evidence in agents/26's
recording, where it cannot erase a delivered reply.

The 0117 rebind replaces the old exactly-one-action reading:

- Decisions, requests and dispatches already taken are outcomes. A following
  recommendation is not automatically a second action.
- At most one future request is allowed per topic, with no required action slot
  where nothing remains. Goldens exercise both zero and one future request;
  negatives exercise two distinct future requests on one topic.
- Explicit “never actions” clauses have their own **never** assertion, not an
  ordinary four-of-five assertion. A negative treats a completed act as consuming
  the action slot.
- Record-only consequences are not reply instructions. The parked
  `golden-recorded-consequences` controls remain.
- Agents/23 still requires exactly one recommendation for the one improvement
  question; agents/22 still requires directing the lead at preservation.
- Agents/28 and /29 distinguish successful recording before reporting from an
  absent, failed or late record, including a later corrective reply.

Old negatives that merely added a first permissible future request, or omitted
an unnecessary action, were not restored as negatives. Legacy final-reply
segments were normalized where their labels miscounted completed acts. New
next-action controls consolidate those segments into the delivered report.
The workflow/20 source-inspection negative includes an actual read call/result,
not only a prose claim to have inspected source.

These are authored offline controls, including their rubric answers. Offline
proof demonstrates clause binding, rejection, varied passing controls and
aggregation; it does **not** establish that a live subject or model judge is
reliable. Live runs compute new judgments over actual installed-agent traces.

## Observed executions

First execution:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run \
  test/meaning-roles/architect --reporter=verbose
```

Exit 1: 35 failed, 119 passed, 39 skipped. All thirteen behavioral/rubric red
demonstrations failed on unsatisfying recordings (`passed: false` against the
intentional `passed: true` assertion). All four structural red demonstrations
failed on their named broken controls. The real installed declaration also
failed agents/25, with exactly these missing predicates:

```text
record-before-report
outcome-not-action
optional-next-action
```

That first run also exposed check-authoring errors: six scenario directories
were missing their parked goldens, four outcome/action bindings needed separate
never assertions, and the missing agents/13 golden prevented agents/26's
positive aggregation test. Those errors were corrected; they are not evidence
against the implementation.

The affected proof/aggregation checks and agents/26 were then executed with:

```sh
pnpm --filter cratylus exec vitest run test/meaning-roles/architect \
  --reporter=verbose \
  -t '(Example (workflow/(20|23)|agents/(13|14|17|20|21|22|23|24)).*(offline proof|offline aggregation|seen red: never-outcome-actions))|agents/26:'
```

Exit 0: 25 passed, 172 skipped. This includes all four new never-outcome-actions
negatives being rejected and their single-violation batch aggregation. The
unchanged proof and aggregation checks for agents/18, /28 and /29, and structural
positive/negative controls for /11, /25 and /27 had already passed in the first
execution. The real installed declaration's known failure was not rerun.

| Example | Check and observed red work |
| --- | --- |
| workflow/20 | Scenario 20: handed-back ruling, source inspection, missing ruling; explicit red demonstration rejected the hand-back recording. |
| workflow/23 | Scenario 23: conclusion/support, outcome/action boundaries, menu, answerable question, implementation leakage; red demonstration rejected missing support. |
| agents/11 | Structural: declared stance plus a behavioral never-check; the red control removes that check while leaving prose. |
| agents/13 | Scenario 113: ruling/reason and no owned-question hand-back; red demonstration rejected the missing ruling/reason. |
| agents/14 | Scenario 114: supported recommendation, never a substitute menu; red demonstration rejected the menu. |
| agents/17 | Scenario 117: correct opening and actual later-turn ruling/recommendation; red demonstration rejected a later-ruling failure. |
| agents/18 | Scenario 118: approval and scheduling outcome first, optional next actions and lay support; red demonstration rejected reasonless settlement. |
| agents/20 | Scenario 120: long-session ordering, optional next actions, no concealed unresolved issue; red demonstration rejected hiding the night-shoot question. |
| agents/21 | Scenario 121: both owned decisions in the turn, then support; red demonstration rejected handing either decision away. |
| agents/22 | Scenario 122: do not release, direct the lead at preservation, neither descend nor release; red demonstration rejected an extra lead action. |
| agents/23 | Scenario 123: keyboard renewal as one next improvement, never candidate headings or support work steps; red demonstration rejected extra cover work. |
| agents/24 | Scenario 124: unknown partner meaning, actual lead request reported as an outcome; red demonstration rejected an absent lead request. |
| agents/25 | Structural: installed declaration, fixed values, own-text recording rule and no reply guard; actual installed declaration failed the three predicates above; mutation control also failed. |
| agents/26 | Structural: preserve the first delivered hand-back through correction and fail the never-assertion even beside four clean runs; red control deletes the first reply. |
| agents/27 | Structural: pre-act refused write is removed from delivered work but remains in per-run and batch held-drift counts; red control loses that drift record. |
| agents/28 | Scenario 128: approval recorded before report, then realization recommendation; red demonstration rejected missing opening approval; per-clause tests also rejected absent, failed and late recording. |
| agents/29 | Scenario 129: recorded receipt ruling with no invented next work; red demonstration rejected late recording followed by correction; per-clause tests also rejected absent and failed recording. |

## Handoff commands

After the build, the lead runs the normal local suite (the installed declaration
check is deliberately still red before the build):

```sh
pnpm --filter cratylus exec vitest run test/meaning-roles/architect
```

Then run installed-agent smokes, retaining recordings outside the checkout:

```sh
EXECUTION_LIVE=1 EXECUTION_SMOKE=1 EXECUTION_RECORDINGS=/tmp/meaning-roles-smoke \
  pnpm --filter cratylus exec vitest run test/meaning-roles/architect/architect.test.ts
```

Only examples whose smoke passes enter the four-of-five batch. Select those
example names with Vitest's `-t` when not all smokes pass:

```sh
EXECUTION_LIVE=1 EXECUTION_RECORDINGS=/tmp/meaning-roles-batch \
  pnpm --filter cratylus exec vitest run test/meaning-roles/architect/architect.test.ts
```

The existing `EXECUTION_REJUDGE` path rejudges retained subjects without another
architect session. Live model runs, rejudging, lint and type checking were not
performed while writing these checks. The shared `reconstitution/architect`
and `rubric-*` harnesses remain unchanged; no other cut's checks were weakened.
