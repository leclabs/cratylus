# Binding checks seen red

The check-writer ran only the new binding tests, before implementation. No live model session or whole check ran. Declarations and extensions came from the normal packed-and-installed CLI fixture, in a temporary home and Git repository. Only omp host APIs are mocked.
Under decision 0106, agents/11's hand-back guard check and its red evidence are parked unchanged on `cut-7/reply-guards`; `guard.test.ts` is not part of this cut.

## Commands and observations

- `pnpm --filter cratylus exec vitest run test/reconstitution/binding/structural.test.ts`: 31 tests, 24 failed and 7 passed. All 24 failures were example assertions or the contract's missing `workPackage open` operation, not import or fixture failures.
- `BINDING_RED=1 pnpm --filter cratylus exec vitest run test/reconstitution/binding/structural.test.ts -t 'agents/(7|8|9)'`: all 8 selected tests failed on their example assertions. This deliberately changes only test-owned stand-ins: a default-tools declaration gains a read-only list, the assayer gains required worktree isolation, or the handoff grant becomes unrestricted. These prove checks for behavior already holding today can fail. Without this flag, agents/8 and agents/9 and the five non-assayer default-tool checks passed.
- After strengthening agents/8 to inspect the generated isolation module's task-call result as well as the declaration, the focused `-t 'agents/8'` run passed; the same focused run with `BINDING_RED=1` failed on `the delivered binding never requires an isolated assayer task`. The negative forces `isolated: true` on the assayer's task, which is the actual omp isolation surface.

Every test title starts with the example reference it binds. Assertions describe the words they bind.

| Example     | Check in `structural.test.ts` unless noted                                                                           | Observed failing reason                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| agents/1    | typed cut brief starts the lead with those inputs and its output schema, never prose substitutes                     | `workPackage open` is missing.                                                                                                                                              |
| agents/2    | missing examples/concepts/decisions refuses the whole dispatch; ill-typed assignment fields                          | No refusal: `block` was undefined for each missing-field variant and the ill-typed variant.                                                                                 |
| agents/3    | accepted structured return is durably readable with the cut without the conversation                                 | Delivered lead has no `output` schema.                                                                                                                                      |
| agents/4    | fluent explanation cannot substitute for omitted evidence/verdicts/efficiency/hardeningNotes                         | Delivered lead has no `output` schema. The check also accepts an explicitly empty hardening-notes array.                                                                    |
| agents/5    | assignment mismatch and return mismatch, separately for builder, assayer, check-writer and illustrator               | Assignments were not refused; each role lacks a delivered `output` schema.                                                                                                  |
| agents/6    | evaluation preparation rejects a missing cut brief before any live lead run                                          | Existing execution-role `project` preparation accepted a scenario without the typed block. The corrected prompt retains the original assayers' returned verdicts unchanged. |
| agents/7    | each role keeps default tools including shell and all journal appends                                                | Assayer still has a `tools` allowlist. Negative declaration variants reject narrowing for all six roles.                                                                    |
| agents/8    | assayer gathers evidence in the normal environment without a required worktree                                       | Current behavior passes; test-owned required-worktree variant fails the isolation assertion.                                                                                |
| agents/9    | native handoff permission permits the granted subset and refuses both withheld and out-of-ceiling agents             | Current behavior passes; deliberately unrestricted grant fails the forbidden-dispatch assertion. The lead approved narrowing discovered `spawns` as this test seam.         |
| agents/10   | no retired read-only journal gate survives as an alternate narrowing route                                           | A read-only discovered assayer still loses journal appends (`define` is absent).                                                                                            |
| workflow/17 | reported ledger entry survives a fresh state query with every note and figure; also the agents/3 durability check    | `workPackage open` is missing; the delivered output schema is also absent. Persistence is queried through a fresh CLI process.                                              |
| workflow/29 | cut record carries branch information and dispatch needs that branch already checked out; missing cut record refused | `workPackage open` is missing; dispatch without a cut record is not refused. The input contains the cut brief, no branching instructions.                                   |
| workflow/30 | each role keeps default tools including shell and all journal appends                                                | Assayer still has a `tools` allowlist; all six deliberately narrowed declaration variants fail.                                                                             |

## Handoff

The package's existing `test/**/*.test.ts` include discovers `structural.test.ts`. After the implementation lands, rebuild the affected packages and run it without `BINDING_RED`; the lead owns that verification. The output checks compile the delivered schema using the workspace's pinned Ajv with coercion, defaults and property removal disabled. No test-authored schema substitutes for the delivered contract.

## Delivery decision 0113(5): lifecycle capture independent of dispatch spelling

The earlier examples are **reconstitution workflow/4** (the harness's dispatch and return put a cut in flight without approving it) and **workflow/5** (two assayer verdicts approve the packages). Their ledger checks call the lifecycle boundary directly; the new `lifecycle.test.ts` binds the delivered extension to the harness events, using the binding fixture's installed declarations and real installed command.

The fixture presents the dispatch tool with a parameter schema through `getAllTools`. Both `task` and `dispatch_agents` carry exactly the same dispatch/return contracts. The check dispatches one builder, reads the resulting dispatched state, delivers its structured return, reads returned rather than approved, then delivers two independent assayer dispatches and structured verdicts and reads approved. It also checks the exact verdict evidence and counts of recorded dispatches and returns. No agent calls a recording verb.

Subject: **fb0a6d87**, `git archive` into `/tmp/delivery-checks-0113`, `pnpm install --offline`, `pnpm build`, then copy only checks. All hosts are temporary. Command:

```sh
pnpm --filter cratylus exec vitest run test/reconstitution/binding/lifecycle.test.ts --reporter verbose
```

Observed: canonical `task` passes the whole dispatch/return/two-verdict sequence. With the same contract under `dispatch_agents`, the first read is still `submitted`, not `dispatched`: the extension ignores that harness dispatch. This is the strengthened check's seen-red. Initial incomplete builder-assignment and unsupported submit-flag setup mistakes were fixed and are not counted.
