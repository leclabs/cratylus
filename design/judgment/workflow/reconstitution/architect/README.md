# Architect judgment — workflow reconstitution

Owns held-out workflow/3. `architect.test.ts` uses the shared architect suite against this directory's scenario and authored recordings. The fixture resumes a native compaction entry whose remembered completion conflicts with the current branch's real ledger; the journal also contains a newer accepted second-review decision. The architect receives free-text intent, not a fabricated typed assignment.

Executed before the build:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run --config ../../design/judgment/workflow/reconstitution/architect/vitest.config.ts
```

Observed **6 passed, 1 intentionally failed, 2 skipped**. The offline golden/negative proof, each negative rejection, and aggregation all passed. `Example held-out workflow/3 — prefers branch records after compaction > red demonstration: rejects unsatisfying work` failed with `passed: false` against the negative that treats remembered completion as authoritative (`never-old-account`). All three behavioral assertions and the wiring assertion were individually seen rejecting their own controls.

This is deliberately unsatisfying recorded work, not an observed failure of a live installed architect. Both goldens and rubric answers are authored offline controls; their provenance says so. No live session was run. The no-model preflight and live checks were skipped.

Run the same command without `EXECUTION_RED` for the normal offline suite. After the build, use `EXECUTION_PREFLIGHT=1` for fixture/installed-declaration preflight and `EXECUTION_LIVE=1 EXECUTION_RECORDINGS=/absolute/output/path` for five live main-session architect runs and separate rubric-judge sessions. Ordinary assertions require four of five; never-assertions require all five.
