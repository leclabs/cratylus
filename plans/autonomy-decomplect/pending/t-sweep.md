# T-sweep — enumerate and reconcile every reference to the autonomy anchors

## Objective

The autonomy anchors are referenced across tests, fixtures, and gates. Any rename or split must sweep
every dimension that touches them (`rename-enumerates-every-dimension`) — the renamer's own scope-cuts
hide the seams. Reconcile all of them and prove nothing dangles.

## Static inputs (census-surfaced; re-run the sweep, do not trust this list as complete)

- `packages/agent-canon/test/reader-density.test.ts` — references the pole value verbatim.
- `packages/agent-forge/test/catalog/enumerate.test.ts` — enumerates autonomy values.
- `packages/agent-forge/test/stories/E6/S4.elicit-markers.test.ts` — candidate slugs.
- `packages/agent-canon/test/cratylism.test.ts` — the autonomy sign decode.
- `packages/agent-forge/test/adapters/codex/anatomy.test.ts` — autonomy value in a fixture.
- `packages/agent-forge/test/adapters/ir-bridge/agent-canon.agent-forge.json` — generated fixture.
- `packages/agent-canon/test/fixtures/generated/agent-vector.md` — generated fixture.
- any byte-lock / projection gate keyed on the autonomy dimension.

## Constraints

- Re-run a full `rg -nw` sweep for each old and new anchor across `packages/` — do not rely on the list
  above; the census is a starting point, not a guarantee.
- Generated fixtures regenerate from source, never hand-edit — regenerate and verify the diff is exactly
  the anchor change (`generated-banner-absence` trap: confirm which files are generated before editing).
- Non-vacuous verification: every "no remaining reference" grep must be paired with a control that must
  match (`grep-false-green`).

## Dependencies

`T-mece` (all anchor changes must have landed).

## Outputs

- Every test/fixture/gate reconciled; generated ones regenerated from source.
- A non-vacuous grep proof that no old anchor survives and every new one resolves.
- Full suite + typecheck green.

## Acceptance

- `pnpm test` + `pnpm typecheck` green across all packages; `pnpm canon:project` clean.
- A control-backed grep showing zero surviving old-anchor references and every new anchor resolving in
  both source and generated artifacts.
- **Falsifier:** any dangling old-anchor reference; a generated fixture hand-edited instead of
  regenerated; or a "clean" grep with no proven-matching control.
