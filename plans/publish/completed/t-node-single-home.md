# t-node-single-home

**Wave 1.** One home for the pin, one for the floor — they are different facts.

## Intent

Node's version is stated four times and no two agree: `engines.node ">=22"` (root only),
`.nvmrc` = 24, `mise.toml` node = 26, CI = 22. That is not four homes for one fact; it is two
facts with no home each.

- **PIN** — what CI and every developer actually run. Home: **`.nvmrc`**, because it is read
  natively by `nvm`, `fnm`, `asdf`, `actions/setup-node` (`node-version-file`), and by mise
  once idiomatic version files are enabled. The home should be the file the most tools
  already read.
- **FLOOR** — the consumer contract. Home: **`engines.node`**, now copied into all six
  manifests by the previous shard.

## Constraints

- **Pin `24`, and it is load-bearing rather than taste.** npm's version rides Node's, and
  npm ≥ 11.5.1 is what supports trusted publishing; Node 22 ships npm 10.9, which has
  `--provenance` but not trusted publishing. Node 24 is Active LTS and ships npm 11.
- `mise.toml` must DERIVE, not duplicate. If `idiomatic_version_file_enable_tools` does not
  work from a project-local config, DELETE the node line rather than restating `24` — a
  second copy is the defect being removed.
- The workflow reads `node-version-file: .nvmrc`, never a literal.

## Accept

1. `24` appears exactly once as a pin, in `.nvmrc`.
2. `mise.toml` states no node version of its own.
3. `pnpm verify` + `pnpm typecheck:test` green.
