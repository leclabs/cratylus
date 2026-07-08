# stance-guardrail-asktool

**Status: SPEC (praxis) — authored + pin-verified, not executed.** Root-caused by mav (session 3287f321); pins
re-confirmed against the live tree 2026-07-08 — `HookCell` (`toolkit/hook-cell.ts:49`) has no `matcher` field,
`hookIrOf` (`toolkit/hooks.ts:25`) is the forward point, the worker extractor filters `.type=="text"`. Grounded;
execution deferred.

## Intent

**Close the stance-guardrail blind spot: permission-seeking via `AskUserQuestion` evades the guard.** The
stance-guardrail is a `Stop`/`SubagentStop`-only hook. `AskUserQuestion` is a mid-turn tool call that never
fires `Stop`, and even if it did, the worker's transcript extractor reads only `.type=="text"` blocks — so the
menu payload in `tool_use.input` is invisible. Result: a delegate-pole collapse routed through a
multiple-choice question sails past the guard (witnessed this session — a color-scheme + "retire the dup?" menu
the agent should have decided itself). This is a **canon defect in the HookCell source**, not deploy drift.

## Fix — ONE PreToolUse stance binding over all stance-relevant mid-turn tool calls, running the stance-judge on the tool input

## Design decisions

**RATIFIED unification (nico, session a4d74873, 2026-07-08).** This plan and RTB's
`stance-guardrail-jurisdiction` shard BOTH introduced a PreToolUse stance binding — asktool for
`AskUserQuestion` (permission-menu collapse), jurisdiction for `Agent`/`SendMessage` (dispatch-echo
collapse). Two near-identical PreToolUse cells sharing one judge, differing only by matcher + which
`tool_input` field they read, VIOLATES `PARTITIONED` (one concept — "judge a mid-turn tool call's
stance" — must have one home). They are unified here into a SINGLE generalized cell; jurisdiction's
PreToolUse + rubric parts (its scope items 2,3) are ABSORBED into H2 below and struck from that shard.

- **One PreToolUse HookCell** `stance-guardrail-pre` (NOT `-ask`; NOT a new event on the Stop cell).
  `matcher: 'AskUserQuestion|Agent|SendMessage'` (a regex alternation over the stance-relevant mid-turn
  tools; Claude Code matchers accept alternation). One `tool.use.pre` event, one matcher — compatible
  with `write.ts` (which stamps a single matcher per event entry; keeping PreToolUse off the Stop cell
  avoids polluting the Stop entries). Worker branches on `.tool_name`: `AskUserQuestion` → judge
  `questions[]`/`options[]` (permission-menu class); `Agent`/`SendMessage` → judge the `prompt`/`message`
  field + its immediate contract context (dispatch-echo class). Shared judge backend.
- Judge rubric (`stance-judge-prompt.md`) **DOES extend** — add the dispatch-echo class (a dispatch that
  transcribes the operator's/coordinator's literal words without extracted intent, or a spec semantically
  hollow relative to its cited inputs, is a collapse). Harmless for `AskUserQuestion` inputs (an
  option-menu on an in-remit reversible call is already textbook signal-1). Keep the recusal for genuine
  technical-correctness calls and the conservative "when unsure, PASS" clause (a false-deny of a legitimate
  irreversible-consent menu or a substantive dispatch is costlier than a false-block).

## Shards

`pending/`:

- **H1 · MATCHER-IR** — `src/toolkit/hook-cell.ts`: add optional `matcher?: string` to `HookCell`.
  `src/toolkit/hooks.ts` `hookIrOf`: forward `cell.matcher` into the `Hook` IR (it is dropped today). The
  claude adapter already serializes a per-hook `matcher`.
- **H2 · PRE-CELL** — author `src/hooks/stance-guardrail-pre.ts`: a `PreToolUse` HookCell, `matcher:
'AskUserQuestion|Agent|SendMessage'`. Worker branches on `.tool_name` — `AskUserQuestion` → read
  `tool_input.questions[]`/`options[]`; `Agent`/`SendMessage` → read the dispatch `prompt`/`message` field +
  immediate contract context — and feeds the branch payload to the shared stance-judge; on BLOCK emits
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":
"<feedback>"}}` exit 0. Extend `stance-judge-prompt.md` with the dispatch-echo class (absorbs jurisdiction
  scope item 3). Preserve the existing gates (opt-in `agentfactory.stanceGuard`, agent-scope `nico mav`,
  fail-open) + a re-entry cap (don't re-deny an identical `tool_input` twice) + telemetry: log judge
  failures/timeouts (fails-open stays, but a miss becomes observable — absorbs jurisdiction scope item 4).
- **H3 · VERIFY-DEPLOY** — regen the byte-locked worker targets (`pnpm anatomy:project:targets`);
  `test/hook-rule-boundary.test.ts` green (hand-edit diverges from the cell → reds); `pnpm test` + `project`.
  Deploy (`anatomy:project` → `anatomy:deploy:hooks`, merges the PreToolUse entry into settings.json
  non-destructively) is **Operator-reserved** — do not deploy.

## See also

`packages/agent-anatomy/src/hooks/stance-guardrail.ts` (SOURCE cell; `.sh` under `src/toolkit/guardrail/`
are its byte-locked projected workers — edit the cell) · `src/toolkit/{hook-cell,hooks}.ts` ·
`packages/agent-forge/src/adapters/claude/{events,write}.ts` · deployed (do NOT hand-edit)
`~/.claude/hooks/stance-guardrail/` + `~/.claude/settings.json` · RTB `stance-guardrail-jurisdiction`
(unified here; its items 1,4 remain as the Stop-cell residue).
