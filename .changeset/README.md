# Changesets

This directory holds unreleased change descriptions. `pnpm changeset` writes one; `pnpm
version-packages` consumes them all into version bumps and CHANGELOGs.

## What is actually configured

- **6 workspace packages carry the `@cratylus` scope; 5 of them publish.**
  `@cratylus/canon` is listed in `ignore` — it is this repository's own corpus rather than a
  library, nothing depends on it, and it depends on `forge`, so publishing it would drag the
  projector into every consumer's tree. `@cratylus/tooling` is `private: true` and a different
  scope entirely, so changesets never sees it.
- **`linked` and `fixed` are both empty.** Nothing forces the five to move in lockstep;
  each bumps only when a changeset names it. Note that every inter-package dependency is
  `workspace:*`, which publishes as an EXACT pin — so a package that does not bump keeps
  pointing at the exact version of a sibling that did, and that is intended.
- **`access: "public"`** — required for a scoped package, and set here as well as in each
  manifest's `publishConfig`.
- **`baseBranch: "main"`.**

## What is NOT configured, deliberately

There is **no pre-release mode** (`.changeset/pre.json` does not exist and should not be
created on `main`). While that file exists, every `changeset version` produces a prerelease
and the stable channel is unreachable until someone remembers `pre exit` — and `main` is this
repository's release branch. The non-stable channel is served by **snapshots** instead, which
are stateless: `changeset version --snapshot next`, published to the `next` dist-tag,
committing nothing.

## How a release actually runs

`changeset publish` is **not** used. It delegates to `pnpm publish`, which runs `prepack` —
so every package would rebuild at upload time and the bytes reaching the registry would be
bytes no gate had read. pnpm also has no `--provenance`. The pipeline is:

    changeset version → build → pnpm -r pack → pack-smoke gate → npm publish <tarball> --provenance → changeset tag

pnpm owns the `workspace:`/`catalog:` protocol rewrite (in `pack`), the gate audits the exact
tarballs, and npm owns the upload and therefore the attestation.
