# publish

> Five packages to npm. Stable `0.1.0` on `latest` first, then a `next` snapshot channel.

## Why the order is forced

**npm assigns `dist-tags.latest` to the FIRST version a package ever receives, whatever
`--tag` says.** A prerelease into an empty package pins `latest` to a canary permanently,
recoverable only by hand, per package. So the stable release ships first and `next` opens
after it. This inverts the obvious "prerelease first" approach and is the single most
consequential fact in this plan.

## Decisions already made

- **Publish 5, hold `@cratylus/canon`** — it is this repo's corpus (the agent roster), nothing
  depends on it, and it depends on `forge`, so publishing it drags the projector into
  consumer trees. `@repo/tooling` is private and publishes nothing by construction.
- **Non-stable = snapshot** (`0.0.0-next-<ts>`), not changesets pre-mode: `pre enter` writes
  `.changeset/pre.json` into the repo and locks the stable channel shut while it exists, and
  `main` IS the release branch here.
- **`changeset version` → build → `pnpm -r pack` → pack-smoke → `npm publish <tarball>
--provenance` → `changeset tag`.** Not `changeset publish`: it delegates to `pnpm publish`,
  which runs `prepack`, so every package REBUILDS at upload time and the published bytes are
  bytes no gate ever read. pnpm has no `--provenance` either.
- **Node: pin `24` in `.nvmrc`, floor `>=22` in `engines.node`.** A pin and a floor are
  different facts; collapsing them produced four disagreeing homes.

## Shards

| state   | task                  | concern                                                         |
| ------- | --------------------- | --------------------------------------------------------------- |
| ready   | `t-publish-blockers`  | LICENSEs, `engines`, changeset config, stale prose              |
| pending | `t-node-single-home`  | one home for the pin, one for the floor                         |
| pending | `t-pack-smoke`        | the gate over the bytes a consumer actually receives            |
| pending | `t-ci-workflows`      | setup action, reusable gates, verify rewired                    |
| pending | `t-release-workflows` | `release.yml` → `latest`; `release-next.yml` → `next` snapshots |
| pending | `t-first-publish`     | push, dry-run, `0.1.0`, install on a fleet host                 |

## The irreversible step

`t-first-publish` is the only shard that cannot be undone — npm unpublish is a 72-hour
window and then never. Everything before it is a dry run.
