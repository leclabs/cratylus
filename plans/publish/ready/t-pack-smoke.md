# t-pack-smoke

**Wave 2.** The gate over the bytes a consumer actually receives.

## Intent

A published tarball is the one artifact no test reads — `pnpm test` drives `src/`, the oracle
drives the render tree — and it is IRREVOCABLE: npm unpublish is a 72-hour window and then
never. Four laws, each a shape present in this workspace rather than imagined:

1. **protocol** — no `workspace:` or `catalog:` survives in a packed manifest. Both are pnpm
   inventions; npm's resolver installs neither. pnpm rewrites them during `pack`, `npm pack`
   does not, and locally the workspace link satisfies either — so the defect is invisible
   until a consumer installs.
2. **target** — every `bin` and every `exports` target exists INSIDE the tarball. `files`,
   the `exports` map and tsup's entry list are three enumerations of one fact. Note forge
   ships a WILDCARD subpath (`./adapters/*`), which exact-string matching is dark on.
3. **lifecycle** — no `prepack`/`prepare`/… survives. pnpm's manifest obfuscation strips
   them and npm's does not, so a survivor is an exact detector for "not packed by pnpm" —
   the same evidence as (1), read off an independent field.
4. **license** — a `license` field implies a LICENSE file in the tarball.

## Constraints

- **Pure predicates, separately testable**, in the idiom this corpus already uses
  (`plan-set.ts` + its CLI + a vitest gate over the pure half). The controls must drive the
  SAME function the live check drives.
- Runs on **every PR**, not release-only: a gate that only the release runs is a gate that
  fails at the worst possible moment.
- Register it in `gate-convicts`.

## Accept

1. Convicts each of the four shapes synthetically, and exonerates a well-formed tarball.
2. Runs over the REAL `pnpm -r pack` output and passes.
3. `pnpm verify` + `pnpm typecheck:test` green.
