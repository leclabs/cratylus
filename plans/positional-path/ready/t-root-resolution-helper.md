# t-root-resolution-helper

**Wave 0.** One way to find the repo root, per language. Everything else derives.

## Intent

23 sites each answer "where is the repo root" by counting parent hops from wherever they
happen to sit. The answer is the same for all of them and does not depend on the asker, so
it should be computed once.

## Constraints

- **It must work on a cold clone AND in a tarball with no `.git`.** `git rev-parse
--show-toplevel` is the primary; a positional fallback is permitted only as a fallback, and
  the fallback must be at the helper's own single site — which is the entire point.
- **It must work from a TEMP DIR.** Several suites build synthetic repos in `mkdtemp` and run
  the subject there; a helper that assumes it lives inside the real checkout breaks them.
  Take the start directory as a parameter.
- TS and shell both need one. They are separate homes for one law — note the duplication
  explicitly rather than pretending a shared implementation is possible across the boundary.
- Do not migrate call sites here. This shard lands the helper and its tests only.

## Accept

1. The helper resolves correctly from: repo root, a nested package, a temp dir with `.git`,
   and a temp dir WITHOUT `.git` (fallback path) — all four exercised.
2. `pnpm verify` + `pnpm typecheck:test` green.
