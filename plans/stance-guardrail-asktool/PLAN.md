# stance-guardrail-asktool

**Status: SPEC (praxis) — authored, not executed.** Root-caused by mav (session 3287f321); execution deferred.

## Intent

**Close the stance-guardrail blind spot: permission-seeking via `AskUserQuestion` evades the guard.** The
stance-guardrail is a `Stop`/`SubagentStop`-only hook. `AskUserQuestion` is a mid-turn tool call that never
fires `Stop`, and even if it did, the worker's transcript extractor reads only `.type=="text"` blocks — so the
menu payload in `tool_use.input` is invisible. Result: a delegate-pole collapse routed through a
multiple-choice question sails past the guard (witnessed this session — a color-scheme + "retire the dup?" menu
the agent should have decided itself). This is a **canon defect in the HookCell source**, not deploy drift.

## Fix (mav-specced) — a PreToolUse binding matched to AskUserQuestion, running the stance-judge on the tool input

## Design decisions

- **Separate HookCell** (`stance-guardrail-ask`), NOT a new event on the existing cell. Rationale: `write.ts`
  attaches a hook's single `matcher` to every event entry, so adding `tool.use.pre` to the Stop cell would stamp
  `matcher:"AskUserQuestion"` onto the Stop entries too (harmless-but-noisy); and the two workers have
  structurally different I/O (transcript-text + `block` vs `tool_input` + `deny`). Share the judge backend.
- Judge rubric (`stance-judge-prompt.md`) needs NO change — an option-menu on an in-remit reversible call is
  textbook signal-1; it already blocks that class, it just never saw it. Keep the conservative "when unsure,
  PASS" clause (a false-deny of a legitimate irreversible-consent menu is costlier than a false-block).

## Shards

`pending/`:

- **H1 · MATCHER-IR** — `src/toolkit/hook-cell.ts`: add optional `matcher?: string` to `HookCell`.
  `src/toolkit/hooks.ts` `hookIrOf`: forward `cell.matcher` into the `Hook` IR (it is dropped today). The
  claude adapter already serializes a per-hook `matcher`.
- **H2 · ASK-CELL** — author `src/hooks/stance-guardrail-ask.ts`: a `PreToolUse` HookCell, `matcher:
'AskUserQuestion'`, worker reads `tool_input` (the `questions[]`/`options[]`), feeds it to the shared
  stance-judge, and on BLOCK emits `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":
"deny","permissionDecisionReason":"<feedback>"}}` exit 0. Preserve the existing gates (opt-in
  `agentfactory.stanceGuard`, agent-scope `nico mav`, fail-open) + a re-entry cap (don't re-deny an identical
  `tool_input` twice).
- **H3 · VERIFY-DEPLOY** — regen the byte-locked worker targets (`pnpm anatomy:project:targets`);
  `test/hook-rule-boundary.test.ts` green (hand-edit diverges from the cell → reds); `pnpm test` + `project`.
  Deploy (`anatomy:project` → `anatomy:deploy:hooks`, merges the PreToolUse entry into settings.json
  non-destructively) is **Operator-reserved** — do not deploy.

## See also

`packages/agent-anatomy/src/hooks/stance-guardrail.ts` · `src/toolkit/{hook-cell,hooks}.ts` ·
`packages/agent-forge/src/adapters/claude/{events,write}.ts` · deployed (do NOT hand-edit)
`~/.claude/hooks/stance-guardrail/` + `~/.claude/settings.json`.
