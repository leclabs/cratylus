# `@cratylus/tooling`

Dev helpers shared by this repository's own build steps and test suites.

**Private by construction.** The package is named `@cratylus/tooling` and `private: true` is set,
so it cannot reach the registry. It is a package rather than a directory inside one because
`packages/canon/tooling/` is canon's, and forge's tests cannot import from it without making forge
depend on canon, or reaching across a package boundary by relative path, which breaks
`typecheck:test`.

**No build.** `exports` point at TypeScript source. Every consumer is either `vitest` or a
`tsx`-driven script, both of which read `.ts` directly, so a `dist/` here would be a build
step with no reader. Nothing published means nothing to compile for.

## `./repo-root`

`repoRoot(from)` / `requireRepoRoot(from)` — ask git, then walk up for
`pnpm-workspace.yaml`, then refuse. `src/repo-root.sh` is the shell twin, sourced by path
because shell has no module resolution.

Why it exists: a path built from a count of parent hops encodes the asking file's own
location in its body, so moving that file silently repoints it — and the failure surfaces as
an absence rather than an error. `packages/canon/test/positional-path.test.ts` is the law.
