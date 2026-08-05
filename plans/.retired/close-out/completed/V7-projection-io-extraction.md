# V7 · projection-io-extraction

**Objective.** Separate _rendering_ from _writing_ in the projector. This is the one part of the
proposed compiler/projector split the code actually justifies.

## The state, measured

`packages/forge/src/project/index.ts:119-261`. Per kind: scan → dynamic `import()` of the
authored module → `opts.adapter.agentDef(...)` (L161) → **`writeFileSync` (L165)**. Skills: L187 →
**L188**. Hooks: `renderHooks(...)` L233 → **L239, L250**. The adapter call and the disk write are
adjacent statements; no intermediate value survives the loop body.

`HarnessAdapter` (`core/harness-adapter.ts:38-51`) already returns
`HarnessProjection = { filename, content }` — a flat byte pair. The type boundary is already clean;
what is missing is an **aggregate**, so projection cannot be exercised without a tmpdir.

**Scope note — the package cut is NOT in this shard, and is dropped.** The census found no aggregate
type to draw a package boundary around, 2 adapters totalling 7 small files, and 198 `anatomy` import
sites that would churn. See PLAN §Decisions. Extract the I/O; do not move packages.

## Inputs

`packages/forge/src/project/index.ts` · `packages/forge/src/core/harness-adapter.ts` ·
`packages/forge/src/cli/commands/project.ts` · `packages/canon/src/toolkit/project-cli.ts`

## Constraints

- `projectPluginSet` returns the artifact tree; **the caller writes**. One writer.
- Behaviour-preserving: same bytes at the same paths as today. This is a refactor with a new seam,
  not a change in what gets projected.
- Do not coin a name for the aggregate that implies it is MODEL's `IR`. MODEL's `ir : agent → IR` is
  **agent-scoped** and is already realized by the `Agent` interface (`anatomy/index.ts:215`); a
  whole-plugin-set aggregate is a different thing and is undeclared by any grounding doc. Keep it a
  local structural type. Naming it canonically is a cratylism act and is out of scope.
- V1 owns `project/runtime-shim.ts` and V5 owns the bin-name literals — do not touch either.
- **You also own the dead import**: `packages/canon/src/toolkit/project-cli.ts:31` imports
  `emitRuntimeShim` and never calls it (the claude path emits shims inside `projectPluginSet`,
  `project/index.ts:190`). Remove it as part of adapting that caller to the new return type.

## Outputs

`packages/forge/src/project/index.ts` · `packages/forge/src/cli/commands/project.ts` ·
`packages/canon/src/toolkit/project-cli.ts` · `packages/forge/test/project/*`

## Acceptance

1. A test calls `projectPluginSet` and asserts on the returned artifact tree **with no filesystem
   writes at all** — no tmpdir, no mock fs. **This is impossible on the pre-state**; that is the
   falsifier.
2. Byte-identical output: project the canon before and after, diff the two render trees, expect empty.
3. `writeFileSync` appears **zero** times in `packages/forge/src/project/index.ts`.
4. The dead `emitRuntimeShim` import is gone from `packages/canon/src/toolkit/project-cli.ts`.
5. `pnpm test && pnpm typecheck` green.
