# Meaning roles — workflow judgment checks seen red

These checks bind `design/judgment/workflow/meaning-roles.md` examples 1 and 2, not visible workflow/24. They are kept outside builder outputs and run against the work only at judgment. Each operation gets an independent temporary repository.

## Bindings

- **workflow/1:** `freeze.test.ts`, both `1:` tests. Open two cuts over museum receipt, integrate the first as the recorded architect through contract F4, then attempt supersession or retirement as the lead. Require refusal naming the remaining cut and architect; compare all journal bytes, current design and complete concept history before and after.
- **workflow/2:** `freeze.test.ts`, both `2:` tests. Open the theatre admission cut, supersede as architect, establish that both original and correction survive and the correction is current, then attempt supersession or retirement as builder. Require the same refusal and unchanged bytes, current design and history.

`check.ts` is the single delivered-output predicate used by capability execution and offline controls. `recordings.json` contains explicitly authored positive and negative observations, not captured CLI output. `proof.test.ts` also isolates journal, current-view and history corruption behind an otherwise correct refusal, so an error status alone cannot satisfy the example.

## Observed red before the build

```sh
pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/workflow/meaning-roles/vitest.config.ts
```

Observed **4 failures** (2026-10-11; initial capability run, `artifact://32`):

- workflow/1 supersede and retire reached `workPackage integrate`, which the pre-build CLI does not implement. This is a missing F4 prerequisite, **not** evidence that the remaining-freeze assertion was reached.
- workflow/2 supersede and retire both ran successfully as builder (exit 0), appended a journal entry, changed current meaning and changed history after the architect correction. The refusal and all three preservation checks failed.

To establish substantive red for workflow/1 independently of the unavailable integration operation, and to prove both examples' delivered-output predicate:

```sh
EXECUTION_RED=1 pnpm --filter cratylus exec vitest run \
  --config ../../design/judgment/workflow/meaning-roles/vitest.config.ts proof.test.ts
```

Observed **4 intended failures, 16 passed**, exit 1. Each example's supersede and retire negative produced all five failure names: `refused-before-append`, `unchanged-journal`, `unchanged-current-meaning`, `unchanged-history`, `named-refusal`. Goldens passed; independently corrupting bytes, current meaning or history behind an exit-1 refusal was detected. These controls prove the assertions, not implementation of integration or cross-cut protection.

## Judgment command

Run the first command, with `EXECUTION_RED` unset, against the built CLI at judgment. For offline proof alone, add `proof.test.ts`. No implementation was changed. No unresolved meaning question was needed to bind these examples.
