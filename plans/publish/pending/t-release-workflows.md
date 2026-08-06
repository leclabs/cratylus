# t-release-workflows

**Wave 4.** `release.yml` → `latest`; `release-next.yml` → `next` snapshots.

## Intent

**Stable.** `changesets/action` opens a Release PR accumulating version bumps; merging it
publishes. Two jobs: unprivileged `gates`, then `release` holding `id-token: write` and
`NPM_TOKEN`. A single job with an early gate step would hold the credential while running
the corpus's own test code.

**Non-stable.** `workflow_dispatch` snapshot → `next`. It must **refuse to run until every
published package exists on `latest`**, because npm pins `dist-tags.latest` to the first
version a package ever receives whatever `--tag` says.

## Constraints

- **Publish path**: `changeset version` → build → `pnpm -r pack` → pack-smoke →
  `npm publish <tarball> --provenance` → `changeset tag`. NOT `changeset publish`.
- `concurrency.cancel-in-progress: false` on both — a cancelled publish is a half-published
  release, irrevocably.
- `fetch-depth: 0` on release (`changeset tag` needs history); verify stays shallow.
- Give `changesets/action` a conventional `commit:`/`title:`; its default fails commitlint.
- **UNVERIFIED**: that `npm publish <tarball> --provenance` accepts a tarball spec. Prove it
  with `--dry-run` before the real run; fallback is publishing the extracted directory.

## Accept

1. Both workflows parse (`actionlint` or a dispatch dry-run).
2. `npm publish --dry-run` succeeds for all five packages with provenance requested.
