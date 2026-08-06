# t-dead-and-tests

**Wave 0.** Remove the dead file; move test material out of `src/`.

## Intent

`toolkit/cold-oracle/sweep.mjs` has **zero call sites** — one prose mention in
`cratylism.test.ts`. Delete it; a file nothing invokes is not a tool.

11 files under `toolkit/guardrail/` are test material living in a source directory:
`test-stance-guardrail.sh`, `test-deploy-drift-notice.sh`, `calibrate-stance-judge.sh`, and
8 files under `fixtures/`. A test suite in `src/` is indefensible on any reading — and one of
them, `test-deploy-drift-notice.sh`, is invoked by nothing at all.

## Constraints

- Re-census before moving. The counts above were measured at `32c8d3b3`; enumerate by pattern.
- `stance-guard:test` in root `package.json` invokes `test-stance-guardrail.sh` — it moves too.
- The fixtures are read by BOTH `test-stance-guardrail.sh` and `calibrate-stance-judge.sh`,
  and `turn-193.txt` is additionally read by `command-veracity.test.ts` as the closed-record
  exemplar. Resolve all three reference sets BEFORE declaring the move done — a rename's
  footprint is its reference set, never its definition site.
- `calibrate-stance-judge.sh` calls a live LLM and is invoked manually. It is still test
  material; keep it runnable.

## Outputs

`packages/canon/test/guardrail/` (or the shape the existing test tree already uses — check
before inventing one), root `package.json`, and whatever else the census turns up.

## Accept

1. `git ls-files packages/canon/src/toolkit | grep -cE 'test-|fixtures/|calibrate-'` = 0
2. `sweep.mjs` gone; `git grep -c sweep.mjs` = 0 outside recorded turns
3. `pnpm stance-guard:test` runs from its new home
4. `pnpm verify` + `pnpm typecheck:test` green
