# Architect judgment — workflow reconstitution

Owns held-out workflow/3. `architect.test.ts` uses the shared architect suite against this directory's scenario and authored recordings. The fixture resumes a native compaction entry whose remembered completion conflicts with the current branch's real ledger; the journal also contains a newer accepted second-review decision. The architect receives free-text intent, not a fabricated typed assignment.

Under 0106, the reply-guard examples move unchanged to `cut-7/reply-guards`; this scenario and its controls stay unchanged. The shared delivered-evidence projection now judges both an old-style refused reply and its rewrite, because both reached their reader. Only pre-act refusals count as held drift. The rebound prompt check was seen red before that change (**1 failed, 39 skipped**, `artifact://1901`); the visible architect suite's README records the command and evidence. No live model run was made for the split.

Executed before the build:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/reconstitution/architect/vitest.config.ts
```

Observed **6 passed, 1 intentionally failed, 2 skipped**. The offline golden/negative proof, each negative rejection, and aggregation all passed. `Example held-out workflow/3 — prefers branch records after compaction > red demonstration: rejects unsatisfying work` failed with `passed: false` against the negative that treats remembered completion as authoritative (`never-old-account`). All three behavioral assertions and the wiring assertion were individually seen rejecting their own controls.

This is deliberately unsatisfying recorded work, not an observed failure of a live installed architect. Both goldens and rubric answers are authored offline controls; their provenance says so. No live session was run. The no-model preflight and live checks were skipped.

Run the same command without `EXECUTION_RED` for the normal offline suite. After the build, use `EXECUTION_PREFLIGHT=1` for fixture/installed-declaration preflight and `EXECUTION_LIVE=1 EXECUTION_RECORDINGS=/absolute/output/path` for five live main-session architect runs and separate rubric-judge sessions. Ordinary assertions require four of five; never-assertions require all five.
