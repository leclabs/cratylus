# P2 — the resolver `forge/src/resolve/` + patch primitives (the semantic-merge core)

**static (censused):** `packages/agent-forge/src/core/engine/merge.ts` (`mergeIR(scopes)` ·
`mergeRules`/`mergePermissions`/`mergeEnv` — the ordered-layering fold to GENERALIZE, confirmed present) ·
`packages/agent-forge/src/anatomy/index.ts` (fragment value-types → the `kind` axis) · `plans/plugin-cli/
NORTH-STAR.md` §4 · **dep-fed:** P1's `defineAgentPlugin`/`AgentPlugin` contract.

**scope:** build `resolve(config) → ResolvedAgentSet` in `forge/src/resolve/`, exported as `./resolve`:

- `config = { extends: AgentPlugin[], patches: PatchEntry[] }`; `PatchEntry = { target: <binding>, op, value,
force?: priority }` (an ARRAY keyed by imported binding, never a string-keyed map — NORTH-STAR §4).
- **`kind` ⊥ `dimension`:** a fragment's `kind` = structural value-type (`scalar`·`set`·`structured`), declared at
  fragment-definition; legal ops follow: `scalar→{replace}` · `set→{replace,append}` · `structured→{replace,merge}`.
- **Resolution = ORDERED FOLD over the base** (NOT winner-pick): `replace` resets/discards prior; `append`/`merge`
  accumulate. Order = `extends` position then `patches` position; a `force(priority)` op hoists to fold AFTER all
  non-forced ops; a force-priority tie is an error.
- **LOUD validation (never silent):** missing `extends` target · dangling/late-bound reference · reference cycle
  (acyclicity, §3) · illegal `op` for a `kind` · force-priority tie — each THROWS. Reuse `mergeIR`'s fold shape.

**accept (falsifier):** `resolve()` folds a fixture of 2 plugins + patches deterministically — a `replace` erases
prior, an `append`/`merge` accumulates, `force` wins regardless of position; EACH of {missing target, illegal op,
force tie, reference cycle} THROWS a named error (asserted, not silent); a new `resolve` unit test + `pnpm -C
packages/agent-forge typecheck` green; a cold Ω\* read of the fold law decodes "ordered fold — replace resets,
append/merge accumulate, force folds last." **dep:** P1 (wave 1).
