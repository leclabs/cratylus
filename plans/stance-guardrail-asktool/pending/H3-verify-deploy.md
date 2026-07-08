# H3 · VERIFY — byte-lock regen + green (deploy Operator-reserved)

**Objective.** Regenerate the byte-locked worker targets and prove green; stop at the deploy boundary.

## Dependencies

H1, H2 ⊳dep.

## Constraints / checks

- Regen the committed worker/target artifacts: `pnpm anatomy:project:targets` (a hand-edit that diverges from
  the cell reds `test/hook-rule-boundary.test.ts`).
- `pnpm test` (agent-anatomy) green incl. `hook-rule-boundary`; `pnpm project` emits the new `PreToolUse` hook +
  the `settings.json` render carries it.
- **Behavioral check (isolated):** simulate a PreToolUse payload = an in-remit option-menu → the judge DENIES
  with feedback; a genuine irreversible-consent menu → PASSES.
- **Do NOT deploy.** `anatomy:deploy:hooks` (merges into `~/.claude/settings.json`) is Operator-reserved.

## Acceptance

- FAIL if byte-lock test reds (targets not regenerated).
- FAIL if the projected `settings.json` lacks the `PreToolUse`/`AskUserQuestion` stance hook.
- FAIL if the behavioral check does not deny a synthetic in-remit menu.
- FAIL if anything was deployed.
