# H2 · ASK-CELL — the PreToolUse stance binding on AskUserQuestion

**Objective.** Author a new HookCell that runs the stance-judge on an `AskUserQuestion` tool call and denies on
a delegate-pole collapse (a menu on an in-remit reversible call).

## Dependencies

H1 ⊳dep (needs the `matcher` field).

## Inputs

- `packages/agent-anatomy/src/hooks/stance-guardrail.ts` — the existing Stop cell + its worker (the shared
  judge backend, the gates, the deny/block shapes).
- The claude event map: `tool.use.pre → PreToolUse`.

## Constraints

- New cell `src/hooks/stance-guardrail-ask.ts`: `events: ['tool.use.pre']`, `matcher: 'AskUserQuestion'`.
- Worker reads `tool_input` (`questions[]` + `options[]`), feeds it to the SAME stance-judge; on BLOCK emit
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":
"<feedback>"}}`, exit 0. Otherwise allow.
- Preserve the existing gates: opt-in `agentfactory.stanceGuard`, agent-scope `nico mav`, fail-open on any
  error. Add a re-entry cap: do NOT re-deny an identical `tool_input` twice (no `stop_hook_active` analog for
  PreToolUse).
- Reuse the judge PROMPT unchanged (`stance-judge-prompt.md`) — an option-menu on a reversible in-remit call is
  already signal-1; keep the conservative "when unsure, PASS".

## Acceptance

- FAIL if the cell does not bind `PreToolUse` scoped to `AskUserQuestion`.
- FAIL if the worker feeds the transcript's last text turn instead of `tool_input`.
- FAIL if the deny output is not the documented `hookSpecificOutput` shape.
- FAIL if the opt-in / agent-scope / fail-open gates are lost, or the re-entry cap is missing.
