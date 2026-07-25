# S5 · module-scan-subpath

**Objective.** Give `module-scan` its own package subpath export so `agent-canon` stops importing the
`./core` barrel. Today canon's **live** projection path drags the entire IR surface in transitively,
which is what makes the excision look riskier than it is.

**Inputs (pinned, exist at authoring).**

- `packages/agent-forge/src/core/module-scan.ts` — survives the excision; sits in `core/` but outside
  `core/{ir,engine,serialize,adapter}/`
- `packages/agent-forge/src/core/index.ts` — 11 `export *` lines mixing both lineages
- `packages/agent-forge/package.json` `exports` — note `"."` **and** `"./core"` both resolve to
  `dist/core/index.js`; the package root export _is_ the core barrel
- `packages/agent-canon/src/toolkit/project-cli.ts:27` — imports `resolveModulePath`, `scanCellDirNames`,
  `scanModuleNames` from `@leclabs/agent-forge/core`

**Constraints.**

- Additive and behavior-preserving: this shard adds a narrow export and repoints one consumer. It does
  **not** delete from the barrel — S6 owns that.
- `dual-enumeration diverges silently` — an `exports` map and a build config are two enumerations of the
  same fact. Adding a subpath means updating **both**, then proving the built artifact actually resolves
  from outside the workspace, not merely that TypeScript is satisfied.
- Verify against the **built** package, not the source tree: the consumer resolves `dist/`.

**Dependencies.** None. Wave 0.

**Outputs.** A `./module-scan` (or equivalently narrow) subpath export wired in `package.json` and the
build; `project-cli.ts` importing through it; zero `@leclabs/agent-forge/core` imports left in
`agent-canon`.

**Completion criteria (falsifier).** `git grep -n "agent-forge/core" -- packages/agent-canon` returns
nothing (`git grep` errors loudly rather than silently no-matching), with a control proving the pattern
can match; `pnpm build` then a resolution check that the new subpath loads from built output; full
`pnpm test` green; `pnpm canon:project` still emits the full render tree. REJECTED if the subpath is
declared in `package.json` but not produced by the build; if the check only type-checks and never
resolves the built artifact; if any other package still reaches `@leclabs/agent-forge/core`; or if the
core barrel is edited here rather than in S6.
