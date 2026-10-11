# Architect judgment — agents reconstitution

Owns held-out agents/2 and agents/4. `architect.test.ts` uses this directory's scenarios and authored recordings through the architect suite. The subject is the installed architect in a main session, given free-text intent. Example 4 resumes a native session containing twelve preceding conversational checkpoints, then receives the concept-level reports needed for its update; the opening history is fixture data, not alleged live model output.

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
