# stance-guardrail-jurisdiction — the judge must see the dispatch channel

**Lane** Mav (hook machinery) + Nico (rubric doctrine, judge) · **Status** pending.

The stance guardrail is structurally blind to the drift class that matters most. Reviewer evidence
(field, 2026-07-03), three mechanisms, all by construction:

1. **The jq selector drops `tool_use` blocks** (`map(select(.type == "text"))`) — a dispatch prompt
   (the agent→agent artifact where echo/transcription defects live) is never part of the judged
   text; only surrounding prose reaches the judge, which reads as confident narration.
2. **Pure-tool turns are never judged** (`[ -n "$turn" ] || allow_stop`) — a turn that only
   dispatches exits before the judge runs.
3. **The rubric recuses itself** ("judge the stance, not the correctness of technical content") —
   the echo class is defined as a linguistic feature, so a semantically hollow but expert-reading
   dispatch passes by design.

Net: the drift travels through the one channel the extractor deletes, in turns it often skips,
under a rubric that disclaims the call. Deterministic extraction over-corrected until the
LLM-as-judge never sees the evidence.

## Static

`packages/agent-anatomy/src/toolkit/guardrail/{stance-guardrail.sh, stance-judge.sh,
stance-judge-prompt.md}` · `src/toolkit/hooks.ts` (agent-forge Hook sources; PreToolUse is an
available event) · the reviewer analysis above (the defect contract).

## Scope

(1) **Judged surface**: include `tool_use` payloads of dispatch-class calls (Agent · SendMessage —
the prompt/message fields) in the judged text; a pure-tool turn WITH a dispatch payload is judged,
never skipped. (2) **PreToolUse binding**: a second hook entry judging the dispatch prompt BEFORE
the call fires (block = the dispatch never leaves), agent-scoped like Stop; fails open; loop-safe.
(3) **Rubric**: extend with the dispatch-echo class — a dispatch that transcribes the operator's or
coordinator's literal words without extracted intent, or a spec whose semantic content is hollow
relative to its cited inputs, is a collapse; the judge receives the dispatch payload + its
immediate contract context. Keep the recusal for genuine technical-correctness calls; the boundary
is stance-in-the-artifact, not code review. (4) **Telemetry**: judge failures/timeouts logged
(fails-open stays, but a miss becomes observable).

## Accept (falsifiers)

- Replay the field case: a turn whose only content is a dispatch `tool_use` carrying a transcribed
  spec → judged and BLOCKED (pre or post); the same turn with an intent-extracted dispatch passes.
- A pure-text collapse still blocks (no regression on the existing class); `stop_hook_active`
  loop-safety intact; a judge timeout produces a log line and an allow (fails-open observable).
- `pnpm run stance-guard:test` extended with both new cases; deployed-artifact mode
  (`STANCE_WORKER_DIR`) proves the shipped worker bites.
