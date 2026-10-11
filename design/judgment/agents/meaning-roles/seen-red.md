# Meaning roles — agents judgment checks seen red

These checks bind `design/judgment/agents/meaning-roles.md` examples 1–3. No subject, model judge, live preflight, smoke or live batch ran while writing them. The live entrypoint is for judgment only.

## Bindings

- **agents/1 → scenario 701:** ruling first; journal ruling recorded before reporting; the settled reservation/admission distinction supports it; support contains facts and reasons only; no menu, hand-back, invented next task or session-length excuse.
- **agents/2 → scenario 702:** recorded approval and readiness first; one recommendation to the lead to start the refund build; factual support; earlier approval/request are outcomes, not additional next actions; no withholding because acts already occurred, approval hand-back or second instruction in support.
- **agents/3 → scenario 703:** both outcomes first; one booking realization recommendation; admission awaits the definition already requested from the lead with no new admission action; factual support; no hidden unresolved question, definition menu, duplicate request to the operator or second booking instruction under another heading.

`scenarios.json` retains each complete example and binds every rubric clause to its words. The `It never` binding shared by coordinated prohibitions carries their explicit never force; it does not invent a new prohibition. Ordinary assertions require 4 of 5; every never-assertion holds in every run taken (0092). Offline controls exercise all five positions; live batches use the shared fail-fast rule (0088). A completed act is an outcome under 0117 and contract R2, never a recommended next action.

The fixture resumes a continuing native session through the shared installed-architect runner. Its authored opening readback and 24 intervening domain exchanges establish session history; they are not instructions restating the rubric. Cases 2 and 3 seed recorded approval and prior delegate-report history. Case 3 deliberately does not define admission. The evaluated subject still receives the actual composed installed declaration and free-text operator assignment.

## Offline controls and proof

Six varied goldens and 29 negative recordings are explicitly authored controls, **not captured model runs**. Trace and rubric answers are authored together. The proof establishes wiring, exact bindings, answer consumption, rejection and threshold aggregation; it does not establish a model judge's semantic reliability or a live architect pass.

Some obligations overlap logically: withholding the build recommendation also omits it, and hiding admission also omits an outcome. A negative records **every** failed clause. The local suite uses the shared checker and projects one assertion at a time through the existing `proveOffline` API, which expects isolated negatives, then checks the full expected failure set. It never manufactures passing answers for overlapping obligations. This is a local judgment adapter, not a second subject runner.

There is a negative for each rubric clause and for using the wrong composed role. Each case also has a delivered violation followed by a conforming correction. The proof asserts that the shared rubric prompt contains both replies; the negative remains failed. No turn-end correction erases a delivered reply (0106).

## Observed red

```sh
env -u EXECUTION_LIVE -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  EXECUTION_RED=1 pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/meaning-roles/vitest.config.ts
```

Final offline proof run (2026-10-11, `artifact://68`): **38 passed, 3 intentionally failed, 3 live tests skipped**, exit 1. All 29 negative recordings were rejected with exactly their declared failure sets; all assertion-level proofs and aggregation tests passed. One red demonstration per example attempted to accept four goldens plus one never-violation and failed with `expected false to be true`.

An earlier proof run caught three check-writing errors: the coordinated never clauses lacked the shared `It never` words in their bindings. Those bindings were corrected before the final proof; no example or expected behavioral verdict was changed.

## Commands

Offline controls only:

```sh
env -u EXECUTION_LIVE -u EXECUTION_RED -u EXECUTION_PREFLIGHT -u EXECUTION_REJUDGE \
  pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/agents/meaning-roles/vitest.config.ts
```

At judgment, after the lead has built the packages, run the same config with `EXECUTION_LIVE=1`, `EXECUTION_RED` unset and `EXECUTION_RECORDINGS` set to the judgment evidence directory. It reuses `liveRun`, `liveBatch`, recording paths and rubric projection from `packages/cli/test/`; it never replaces the installed architect's text or adds a reply guard. Reply-guard retirement is also bound by the visible structural checks.

No unresolved meaning question was needed to bind these examples. Acceptance of the live work remains the lead's judgment task; offline proof does not claim it.
