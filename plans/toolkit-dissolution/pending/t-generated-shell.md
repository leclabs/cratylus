# t-generated-shell

**Wave 4.** The second, unnamed render tree stops being committed into `src/`.

## Intent

9 files — `guardrail/{stance-guardrail,stance-guardrail-pre,stance-judge,
memory-consolidation-nudge,resume-availability-notice,deploy-drift-notice}.sh`,
`guardrail/stance-judge-prompt.md`, `continuity/{continuity-hook,praxis-advance-nudge}.sh` —
are GENERATED. Their source is `workers[].content` in `src/hooks/*.ts`; `project-targets.ts`
resolves and writes them to `targetPath`, and every `targetPath` points into `src/toolkit/`.

1,242 lines of generated shell, committed, inside a package's source directory. The operator
questioned `.render-ts` as bespoke while this sat unnamed and unremarked.

## The decision this shard owes

These bytes are **byte-locked**: `hook-cell.ts` calls `targetPath` the "repo-relative
committed target regenerated from RESOLVED `content` (byte-locked)". The lock is the point —
it is what makes a drifted worker convictable. So the question is not whether they are
generated but **whether a generated artifact should be TRACKED**, and if so, where.

Two candidates, and this shard must rule:

- into `.cratylus/` with the rest of the projection — but that tree is gitignored and wholly
  disposable, and these are the byte-anchors a gate compares against. A disposable anchor is
  not an anchor.
- a tracked, clearly-named generated directory outside `src/` — which keeps the lock and
  stops `src/` containing build output.

State the ruling and its reason in the commit. Do not leave it implied by the path.

## Constraints

- Whatever moves, `project-targets.ts` must write there and the byte-lock gate must still
  convict a hand-edited worker. **Prove it convicts by hand-editing one and watching it red**,
  then revert. A lock that was never made to fail is not known to hold.
- The deployed copies under `~/.claude/hooks/` are placed by `cratylus deploy` from the render
  tree, NOT from these paths. Confirm that before assuming a move is safe.
- `.husky/post-commit` invokes `continuity/praxis-advance-nudge.sh` by path.

## Deps

`t-build-scripts`

## Accept

1. `packages/canon/src/toolkit/` **does not exist**
2. `pnpm canon:project:targets` regenerates to the new location and reports zero drift
3. The byte-lock gate reds on a hand-edited worker — demonstrated, then reverted
4. `pnpm verify` + `pnpm typecheck:test` green; hooks still fire on this host
