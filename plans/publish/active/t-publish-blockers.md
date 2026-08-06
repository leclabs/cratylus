# t-publish-blockers

**Wave 0.** Five things that would ship a defective tarball or fail the run.

## Intent

- **5 of 6 packages declare `"license": "MIT"` and ship no LICENSE file** (only `forge` has
  one). npm includes LICENSE automatically WHEN IT EXISTS, so `files: ["dist"]` is not the
  cause and adding a glob is not the repair — add the file.
- **Zero packages declare `engines`.** npm has no inheritance; the floor must be copied into
  each published manifest.
- **`.changeset/config.json` needs `ignore: ["@cratylus/canon"]`**, and the pending changeset
  `initial-cratylus-release.md` must drop its canon line — changesets errors if an ignored
  package appears in a changeset.
- **`.changeset/README.md` is false prose**: claims "The 3 packages are linked under `fixed`"
  when there are 6 and `fixed: []`, and describes workflows that do not exist.
- **`packages/memory/package.json` carries a stale `"//"`** claiming it is kept `private:true`.
  It is not private.

## Constraints

- Re-measure before repairing; the roster above was taken at `a54534df`.
- `@repo/tooling` is private and must stay out of the publish set — confirm changesets does
  not pick it up rather than assuming `private: true` is enough.

## Accept

1. Every publishable package has a LICENSE file and an `engines.node`.
2. `pnpm changeset status` names exactly the 5 intended packages.
3. `pnpm verify` + `pnpm typecheck:test` green.
