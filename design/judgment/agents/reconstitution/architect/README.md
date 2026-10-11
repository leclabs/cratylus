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
