# H2 · PRE-CELL — one PreToolUse stance binding over the stance-relevant mid-turn tools

**Objective.** Author a new HookCell that runs the stance-judge on a mid-turn tool call
(`AskUserQuestion` · `Agent` · `SendMessage`) and denies on a delegate-pole collapse — a permission-menu
on an in-remit reversible call, OR a dispatch that transcribes literal words without extracted intent.
Unifies asktool + RTB `stance-guardrail-jurisdiction` (its PreToolUse + rubric scope, items 2–3).

## Dependencies

H1 ⊳dep (needs the `matcher` field).

## Inputs

- `packages/agent-anatomy/src/hooks/stance-guardrail.ts` — the existing Stop cell + its worker (the shared
  judge backend, the gates, the deny/block shapes). This is the SOURCE cell; the `.sh` under
  `src/toolkit/guardrail/` are its byte-locked projected workers — DO NOT hand-edit them, edit the cell.
- `packages/agent-anatomy/src/toolkit/guardrail/stance-judge-prompt.md` worker-content (extend the rubric).
- The claude event map: `tool.use.pre → PreToolUse`.

## Constraints

- New cell `src/hooks/stance-guardrail-pre.ts`: `events: ['tool.use.pre']`,
  `matcher: 'AskUserQuestion|Agent|SendMessage'` (regex alternation).
- Worker branches on `.tool_name`: `AskUserQuestion` → read `tool_input.questions[]`/`options[]`;
  `Agent`/`SendMessage` → read the dispatch `prompt`/`message` field + immediate contract context. Feed the
  branch payload to the SAME stance-judge; on BLOCK emit
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":
"<feedback>"}}`, exit 0. Otherwise allow.
- Extend the judge PROMPT (`stance-judge-prompt.md`) with the dispatch-echo class (a dispatch transcribing
  literal words without extracted intent, or a spec semantically hollow relative to its cited inputs, is a
  collapse). Keep the recusal for genuine technical-correctness calls + the conservative "when unsure, PASS".
- Preserve the existing gates: opt-in `agentfactory.stanceGuard`, agent-scope `nico mav`, fail-open on any
  error. Add a re-entry cap: do NOT re-deny an identical `tool_input` twice (no `stop_hook_active` analog for
  PreToolUse). Add telemetry: log judge failures/timeouts (fails-open stays; a miss becomes observable).

## Acceptance

- FAIL if the cell does not bind `PreToolUse` matched to `AskUserQuestion|Agent|SendMessage`.
- FAIL if the worker feeds the transcript's last text turn instead of the branched `tool_input` payload.
- FAIL if the deny output is not the documented `hookSpecificOutput` shape.
- FAIL if the opt-in / agent-scope / fail-open gates are lost, or the re-entry cap / telemetry is missing.
- FAIL if the dispatch-echo rubric class is absent (a transcribed-spec dispatch must be judgeable).
