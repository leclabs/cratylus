# meaning-roles: freeze checks seen red

Scope: workflow/24–38; frozen interface F1-F6 in the lead's contract. No product source was changed. There are no unresolved meaning questions in this slice.

## Boundaries

`structural.test.ts` runs the packaged, installed `cratylus` command in a temporary repository and loads the extension produced by that installation. It reuses the existing `agent-launch` and `reconstitution/binding` host fixtures. Only omp's host services are substituted; the command, extension, capability dispatch, and lifecycle capture are delivered code.

The gate is called at `tool_call`, before the host-side write. A refused call must set `block: true`, name the cut and architect, and leave the target untouched. Journal refusal must exit 1, name the verb, concept, cut and architect on one line, and leave both history and current meaning unchanged. A filesystem watcher additionally rejects append-then-delete compensation, not merely a changed final snapshot. Admissible changes must append exactly one entry, retain every earlier file byte-for-byte, retain the earlier history, and expose the new wording/reason or retirement in the computed design.

The lifecycle Given uses actual extension dispatch/return/verdict handlers. Independent controls exercise builder return, judgment, a failing finding, redispatch, and two passing assayers reaching complete. Main-session cases supply a continuing conversation through the host session manager so the independent reconstitution gate cannot masquerade as freeze. Sub-session cases use their own acting name.

Before registering fixture checks, `freezeChecks` runs each small renewal predicate once against staff-only renewal (must exit 1) and once against patron renewal (must exit 0). Targets cover visible examples, judgment examples, a judgment subtree, a registered check file, and a registered check folder. These are temporary scenario inputs, not product implementation.

## Example bindings and observed failures

All names below are test-name prefixes in `structural.test.ts`.

| Example     | Check                                                                                                   | Seen red against                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| workflow/24 | lead supersession while a builder is dispatched                                                         | Delivered command accepted and appended; exit 0 instead of refusal.                                                                                                      |
| workflow/25 | retirement separately for lead, builder, check-writer, illustrator, assayer; also absent/empty identity | Delivered command accepted each retirement; exit 0.                                                                                                                      |
| workflow/26 | architect supersession, exact old entries, reason and new current version                               | Overfreeze observation mutation changed the delivered call's status to refusal; the acceptance assertion failed. Unmutated control passed.                               |
| workflow/27 | architect retirement, retained entries and readable history                                             | Same explicit refusal mutation; unmutated control passed.                                                                                                                |
| workflow/28 | supersession and retirement of unrelated opening-hours                                                  | Same explicit overfreeze mutation, separately for both verbs; unmutated controls passed.                                                                                 |
| workflow/29 | protected film approval versus independent museum approval, both verbs                                  | Delivered command accepted the forbidden film change.                                                                                                                    |
| workflow/30 | integration releases renewal while append-only history remains                                          | Delivered command has no `integrate` operation.                                                                                                                          |
| workflow/31 | no builder started; frozen view, examples, check file/folder, both journal verbs                        | Delivered command has no `freeze` operation. Additional direct example-write cases reach the delivered gate without that operation and fail when no refusal is returned. |
| workflow/32 | returned and judging × five non-architect roles × main/sub; example/check and both journal verbs        | Delivered command has no `freeze` operation. The common refusal assertions are independently proven against success and warning-only recordings.                         |
| workflow/33 | failing judgment and subsequent redispatch cannot weaken concept/example/check                          | Delivered command has no `freeze` operation. Both lifecycle Given controls pass independently.                                                                           |
| workflow/34 | architect correction in judgment, then separate lead supersession and assayer retirement refusal        | Architect correction succeeded; delivered command then accepted the forbidden lead supersession.                                                                         |
| workflow/35 | architect example/check correction in main/sub; no permission transferred to assayer/check-writer       | Delivered command has no `freeze` operation. The common gate oracle independently rejects an architect refusal and an absent non-architect refusal.                      |
| workflow/36 | two passing assayers and complete phase still protect all four targets                                  | Delivered command has no `freeze` operation. Complete-phase Given control passes independently.                                                                          |
| workflow/37 | integration releases all paths and concepts while history remains append-only                           | Delivered command has no `freeze` operation (and `integrate` is separately absent).                                                                                      |
| workflow/38 | second approved cut still protects shared renewal after first integration                               | Delivered command has no `integrate` operation.                                                                                                                          |

Missing-operation reds are reported as such: they do not claim that later assertions in those tests have executed against a conforming implementation. Their preconditions have independent lifecycle controls, and their refusal/permission oracles have negative controls. The post-build run must execute those currently unreachable clauses.

## Proof commands and outcomes

```sh
pnpm --filter cratylus exec vitest run test/meaning-roles/freeze/structural.test.ts --reporter=verbose
env MEANING_FREEZE_RED=overfreeze pnpm --filter cratylus exec vitest run test/meaning-roles/freeze/structural.test.ts -t 'workflow/(24|26|27|28)' --reporter=verbose
pnpm --filter cratylus exec vitest run test/meaning-roles/freeze/proof.test.ts --reporter=verbose
```

Observed on 2026-10-11 before the build:

- Final structural baseline: **50 failed, 6 passed (56 tests)**. Failures were the delivered command's permissive journal changes, absent new operations, and absent pre-act gate. Both main/sub approval-only example writes reached the gate and received no refusal. Architect and unrelated-concept controls passed. F1's delivered lead capability call also accepted the forbidden change; this is not just an advertised-schema check. Baseline working-branch revision: `cfb2835ca104f49b9d525840a4d7a58141bcbcbd`.
- The final targeted run failed all five selected tests: workflow/24 still failed on the delivered command accepting staff-only renewal; workflow/26, workflow/27, and both workflow/28 verbs failed on the opt-in overfreeze mutation. The latter is an explicitly injected bad observation, not a claim that the product actually refused those calls. It changes only the recorded status at the assertion boundary; no installed or source implementation is mutated.
- All eight independent oracle/lifecycle controls passed. Their negative recordings are expected to make the actual assertion functions throw; gold recordings must not throw.

After implementation, run the structural suite without `MEANING_FREEZE_RED`, together with `proof.test.ts`, against freshly built packages. The opt-in overfreeze command is supposed to fail and must never be used as a green acceptance run. No live model run is required for these structural examples.
