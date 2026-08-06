# t-mechanism-rehome

**Wave 2.** Mechanism to runtime, validation to forge, scaffold to invoke.

## Intent

Three destinations, one shard, because they share root `package.json` as an output.

**→ `@cratylus/runtime`** (mechanism: reads git and disk):
`plan-set.ts` (569L), `plan-set-cli.ts`, `praxis/praxis.sh` (251L), `cold-oracle/cold-oracle.sh`.
`praxis.sh` duplicates in shell the concepts `plan-set.ts` owns in TS — note the duplication;
do not resolve it here. `carry-on` already reads plan state from runtime, so this is where
the plan-set mechanism belongs.

**→ `@cratylus/forge/validate`** (validation algorithms, 0 canon-cell consumers):
`structural-parsimony.ts`, `symbol-probe-gate.ts`, `formal-block-self-sufficiency.ts`,
`project.ts` (`fragmentToMarkdown` — a projector living in canon).
`forge/src/validate/index.ts` already carries a comment apologising that these live in canon.
Delete the apology with the move.

**→ `@cratylus/invoke`**: `scaffold-cli.ts` — a shipping product command shelved as a dev
script. It scaffolds a CONSUMER's repo.

## Constraints

- **Watch the dependency direction.** Canon depends on forge and runtime; neither may depend
  on canon. Moving a module INTO runtime that still imports canon would create the edge
  `architecture.test.ts` forbids. Check each module's imports before moving it, not after.
- `plan-set.ts` and `praxis.sh` are consumed by root scripts AND by `carry-on`'s runtime
  capability. Resolve the full reference set first.
- The canon test files that import these modules move with them or import across the package
  boundary by specifier — pick one and be consistent; `event-vocabulary.test.ts` is the
  precedent for cross-package test imports by specifier.

## Deps

`t-meaning-uplift`

## Accept

1. `architecture.test.ts` green — no new package edge in either direction
2. `pnpm praxis status` works from the new home
3. `pnpm verify` + `pnpm typecheck:test` green
