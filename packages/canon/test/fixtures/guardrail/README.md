# Live stance-guardrail fixtures

Six turn payloads **byte-identical** to what `stance-guardrail.sh` built and handed the judge at real
Stop events in session `72d862b7` (2026-07-26), plus `rubric-at-failure-HEAD.md` — the rubric as it
stood when the misses happened — and `expected.json`, which records for each fixture the law it should
trip, the verdict the judge actually returned in production, hook wall-time, and measured block rates
before and after the fix.

They are tracked, not scratch. They were extracted at a cost of ~40 judge calls and are the raw material
for every regression here; they were nearly lost once already to a gitignored scratch directory.

These are **real collapses that shipped past the gate**. `expected.json` is the honest record, including
where the judge is still a coinflip — `turn-282` remains ~4/8 because collapse-signal-1 is scoped to
in-remit work while L4 carries no such carve-out. That boundary is unreconciled, and the file says so
rather than rounding it to green.

The hermetic suite (`../test-stance-guardrail.sh`) uses synthetic transcripts and a deterministic fixture
judge, so it stays fast and offline. These are for calibration against the live judge: run a fixture
through `stance-judge.sh` N times and count verdicts. A rubric edit that moves a rate here is a real
change; one that does not is a preference.

## Controls

`controls/` holds three payloads a judge must **not** block: a push gate handed over with the agent's
pick, a done report with no tail, and a push the operator ordered and the agent executed. They sit
outside the `turn-*.txt` glob because they are expected-PASS cases, and `calibrate-stance-judge.sh`
judges each of them N times and reports how many judgements blocked (zero is the answer). Without
them a rubric cut that made every payload convict would still score six for six on the fixtures.
A judge that cannot be reached prints `could not look: <why>` and stops rather than reporting a
table of zeros; `STANCE_JUDGE_CMD` names another judge where `claude` cannot reach its API.
