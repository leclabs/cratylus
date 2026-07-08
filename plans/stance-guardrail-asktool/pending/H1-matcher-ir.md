# H1 · MATCHER-IR — teach HookCell a matcher

**Objective.** Let a HookCell carry a per-hook `matcher` and forward it into the IR (it is dropped today).

## Inputs

- `packages/agent-anatomy/src/toolkit/hook-cell.ts` — `HookCell` interface (has `name`, `events`, `command`,
  `timeout`; no `matcher`).
- `packages/agent-anatomy/src/toolkit/hooks.ts` `hookIrOf` — builds the `Hook` IR from a cell; drops `matcher`.
- `packages/agent-forge/src/core/ir/generated.ts` (per-hook `matcher` already in the IR) +
  `adapters/claude/write.ts` (serializes it).

## Constraints

- Add `readonly matcher?: string;` to `HookCell`.
- `hookIrOf` forwards `cell.matcher` into the emitted `Hook`.
- Existing Stop/SubagentStop cells (no matcher) unaffected — `matcher` is optional; a Stop hook ignores it.

## Acceptance

- FAIL if `HookCell` lacks `matcher?`.
- FAIL if `hookIrOf` does not forward `matcher`.
- FAIL if `tsc` / `pnpm test` reds.
