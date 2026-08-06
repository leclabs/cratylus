# t-build-scripts

**Wave 3.** Repo build tooling to repo-root `scripts/`.

## Intent

`render-oracle/render-oracle.sh`, `project-targets.ts`, `project-targets-cli.ts` are neither
meaning, mechanism, nor projection — they are the fourth thing: build steps this repository
runs on itself. `project-targets.ts`'s own header calls it "one of canon's build scripts".

Industry standard for this in a pnpm monorepo is repo-root `scripts/` or a private
`tooling/` workspace package. Never a published package's `src/`.

## Constraints

- `render-oracle.sh` resolves the forge CLI out of forge's own manifest rather than
  `node_modules/.bin/cratylus`, because on a cold clone `dist/` is absent at install time so
  pnpm silently omits the workspace bin symlink. **This resolution must survive the move** —
  it is measured behaviour, confirmed live this session (`sh: cratylus: command not found`
  in a fresh worktree). Re-verify it from the new location in a cold worktree, not by reading.
- `project-targets.ts` writes the generated shell to `targetPath`. `t-generated-shell` changes
  where; this shard changes only where the WRITER lives. Do not conflate them.
- Root `package.json` and `.husky/post-commit` both reach these paths.

## Deps

`t-mechanism-rehome`

## Accept

1. `git ls-files packages/canon/src/toolkit` returns only what `t-generated-shell` will take
2. `pnpm oracle` works from a COLD worktree — proven by running it there, not by inspection
3. `pnpm verify` + `pnpm typecheck:test` green
