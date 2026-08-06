# t-uncouple-the-trigger

**Wave 0.** Wake stops performing a dream. Handoff enqueues one after release.

## Intent

Two orderings are wrong, and both put an expensive act inside a context that is doing
something else.

- **`wake ⊃ dream` is BLOCKING**: `catch-up ≜ consolidation-owed ⇒ dream ≺ proceed`. A session
  that opens with a backlog pays for consolidation before it has done any work at all — and
  since `encode` is a per-turn duty and the threshold is 12 records, that is most sessions.
  Wake should READ the state and REPORT it, not discharge it.
- **`praxis-sync ≺ dream ≺ release`** puts the drain BEFORE the release that would make the
  session's records inheritable. Inverted, the expensive act becomes out-of-band by
  construction: `praxis-sync ≺ release ≺ enqueue(dream)`.

## Constraints

- These are canon CELLS. Editing them moves the render oracle — expected, and it must be
  argued in the commit rather than re-baselined silently.
- **`handoff ⊃ dream` stays.** It matches every system surveyed (OpenAI Agents SDK, hermes'
  `on_session_end`, MemoryBank's end-of-conversation). Removing it would be a regression; the
  defect is the ORDER, not the edge.
- Wake must still SAY a consolidation is owed. Silence would trade a blocking dream for an
  invisible backlog, which is the 8-of-10 failure with extra steps.
- `memory-consolidation-nudge` fires on every `turn.end`. It should point at the QUEUE once
  one exists; until then leave it, and do not add a second nudge.

## Accept

1. `wake`'s formal block no longer makes a dream a precondition of proceeding, and still
   reports the owed state.
2. `handoff`'s order is `praxis-sync ≺ release ≺ enqueue(dream)`.
3. `pnpm verify` + `pnpm typecheck:test` green; oracle re-baselined with the reason stated.
