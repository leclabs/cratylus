# t-ci-workflows

**Wave 3.** A composite setup action, a reusable gate workflow, verify rewired.

## Intent

`verify.yml` inlines its steps, and `release.yml` will need the identical sequence. Two
copies of a gate sequence drift, and the copy that drifts is always the one that runs less
often — which is the release.

- **`.github/actions/setup/`** — composite: pnpm → node from `.nvmrc` → frozen install.
  A composite rather than a reusable workflow because it is a STEP sequence with no
  permissions, concurrency or job of its own, and must run inside whatever job needs it.
- **`.github/workflows/gates.yml`** — reusable (`workflow_call`), so `release.yml` can
  `needs:` it as a SEPARATE JOB. That separation is a security argument: gates run with
  `contents: read` and no credential; only the publish job gets `id-token: write` and the
  token.

## Constraints — cold-clone hazards, all measured

- **oracle BEFORE test**: `pnpm oracle` PRODUCES the gitignored render trees that
  `harness-parity.test.ts` requires.
- **Never invoke `cratylus` by bin name in CI.** On a cold clone `dist/` is absent at install
  time, so pnpm silently omits the workspace bin symlink — hit live this session
  (`sh: cratylus: command not found` in a fresh worktree).
- **`HUSKY: 0` in the setup action.** `prepare: husky` runs on CI install and sets
  `core.hooksPath`, after which `changesets/action`'s commit is rejected by commitlint.
- `turbo` has `build.cache:false` and `test.cache:false` deliberately — do not add a remote
  cache.

## Accept

1. `verify.yml` calls `gates.yml`; no step sequence is written twice.
2. A PR run is green on a cold runner.
3. `pnpm verify` green locally.
