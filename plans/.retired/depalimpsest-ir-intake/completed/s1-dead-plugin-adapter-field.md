# S1 · dead-plugin-adapter-field

**Objective.** Delete `AgentPlugin.adapters` — the sole structural link from the build-plugin contract to
the IR `Adapter` type — and its type import. It is declared and never read, so it braids the two lineages
for nothing.

**Inputs (pinned, exist at authoring).**

- `packages/agent-forge/src/resolve/plugin.ts:24` — `import type { Adapter } from '../core/adapter/types.js'`
- `packages/agent-forge/src/resolve/plugin.ts:59` — `readonly adapters?: readonly Adapter[]`
- `packages/agent-canon/src/index.ts` — the one real `AgentPlugin` producer; does **not** set `adapters`

**Constraints.**

- Deletion, not deprecation. No `@deprecated`, no optional-kept-for-compat.
- Verify unread **before** deleting, and verify non-vacuously: the naive grep `\.adapters` matches
  `state.adapters` in `core/engine/drift.ts:71,89`, which is a **different object** (drift state). Match on
  the plugin-typed binding, not the bare token — a token-level grep will mislead you in both directions.

**Dependencies.** None. Wave 0.

**Outputs.** `AgentPlugin` without an `adapters` field; the `Adapter` type import gone from
`resolve/plugin.ts`; `resolve/` with zero references into `core/adapter/`.

**Completion criteria (falsifier).** `rg -n "from '\.\./core/adapter" packages/agent-forge/src/resolve/`
returns nothing, with a control proving the grep can match. Full `pnpm test` from the repo root is green.
REJECTED if the field is kept as optional/deprecated; if the removal is justified by a bare `.adapters`
grep without distinguishing `state.adapters`; if any consumer turns out to set the field and a shim is
invented rather than the finding reported; or if the suite is run only for `agent-forge` rather than the
whole corpus.
