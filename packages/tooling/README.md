# `@repo/tooling`

Dev helpers shared by this repository's own build steps and test suites.

**Private by construction.** The scope is `@repo`, not `@cratylus`, and `private: true` is
set — so it cannot reach the registry by accident, and it is invisible to the publish
pipeline's package inventory. That is the whole reason it exists as a package rather than as
a directory inside one: `packages/canon/tooling/` is canon's, and forge and memory cannot
import from it without inverting the dependency direction (canon depends on forge, never the
reverse) or reaching across a package boundary by relative path, which breaks `typecheck:test`.

**No build.** `exports` point at TypeScript source. Every consumer is either `vitest` or a
`tsx`-driven script, both of which read `.ts` directly, so a `dist/` here would be a build
step with no reader. Nothing published means nothing to compile for.

## `./repo-root`

`repoRoot(from)` / `requireRepoRoot(from)` — ask git, then walk up for
`pnpm-workspace.yaml`, then refuse. `src/repo-root.sh` is the shell twin, sourced by path
because shell has no module resolution.

Why it exists: a path built from a COUNT of parent hops encodes the asking file's own
location in its body, so moving that file silently repoints it — and the failure surfaces as
an absence rather than an error. `packages/canon/test/positional-path.test.ts` is the law.
