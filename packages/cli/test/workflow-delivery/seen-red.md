# Workflow delivery — checks seen red

Cut: `workflow-delivery`. Contract: decision 0207; agent behaviour: decision 0154.
Preimplementation subject: `9cab9ff304e66de6e9bc3a10a83b7d5db8fcfab1`.
Observed on 2026-10-13. No production implementation was changed by the check-writer.

## Commands and observations

1. `pnpm build` — succeeded, five build tasks. The packed CLI checks use those artifacts, not source imports or a workspace-linked executable.
2. `pnpm --filter cratylus exec vitest run test/workflow-delivery --reporter=verbose --no-file-parallelism` — **25 failed** in the initial three CLI files. Every failure reached an example assertion; installation, git and extension loading succeeded. Full output: `artifact://4387`.
3. `pnpm --filter @cratylus/runtime exec vitest run test/delivered-context.test.ts --reporter=verbose` — **2 failed, 1 passed** after correcting a fixture's missing reason for a changed context description. The earlier setup refusal is not seen-red evidence. Both final projection failures are the missing public `deliverContext` export, asserted after successfully building the source fixture journal.
4. `pnpm --filter cratylus exec vitest run test/workflow-delivery --reporter=verbose --no-file-parallelism -t 'workflow/3|workflow/4|delivery/2|delivery/5'` — **16 failed, 15 skipped** after adding existing-booking refusal cases, separating explicit installation selection, and proving negative controls for suppression and removal. Full output: `artifact://4390`. The suppression and removal controls executed after a soft inclusion assertion; their negative observations threw as required.
5. `pnpm --filter @cratylus/runtime exec vitest run test/delivered-context.test.ts --reporter=verbose -t 'workflow/1'` — **1 passed, 2 skipped**. The strengthened library check supplies a real fixture document under both an explicit `CRATYLUS_INSTALLATION` and HOME's single installation. A library call without documents still sees none; both prohibited-observation controls threw.

The final CLI suite contains 31 cases; there is no claim of a final combined full-suite run or a postimplementation pass. Only these new checks were run.

## Per-example evidence

| Example | Check | Observed failure |
| --- | --- | --- |
| delivery/1 | `packages/runtime/test/delivered-context.test.ts`, current projection; `install.test.ts`, complete built release | The public projection function is undefined. The actual installed root also lacks `delivered/cratylus/workflow.json`. The runtime fixture successfully records changed subject/relation, superseded wording with dependencies, retirement and a decision before reaching the projection assertion. |
| delivery/2 | `install.test.ts`, provenance/read-only placement; `views.test.ts`, multiple projects and explicit selection | Installed document is absent. With a contract-shaped fixture document supplied independently, another project's design still has no delivered context. Explicit selection of a second fixture installation also yields no delivered context. |
| delivery/3 | `install.test.ts`, upgrade | Reinstallation removes the supplied release-A root but the replacement root has no release-B document. This is an asserted missing replacement, not a file-read exception. |
| delivery/4 | runtime deterministic projection; `install.test.ts`, installed independence | Runtime lacks the projection function. The packed release has no installed projection to remain stable. Once implemented, the checks compare identical serialized projections, mutate the source journal and require the earlier returned value to remain unchanged; installed bytes and provenance must survive later project development. |
| delivery/5 | `install.test.ts`, uninstall and negative controls | The supplied installed document is not visible before uninstall. Actual whole-root removal and booking preservation already pass. The same removal assertions were separately observed to throw on each prohibited observation: root remaining, document remaining, and a leaked journal entry. No removal failure is falsely claimed against the real command. |
| workflow/1 | `views.test.ts`, design/state/overview; runtime library isolation | All three command views return zero contexts instead of one. No journal is created. Library isolation already passes even with installation environment and documents supplied; its assertion controls reject an injected delivered context and journal creation. |
| workflow/2 | `views.test.ts`, three views | Each view returns only booking and local workflow, omitting `cratylus:workflow`. |
| workflow/3 | `views.test.ts`, original and renamed source context; suppression controls | Before the source identity is recorded, the reader wrongly omits delivery. After recording it, the local-only view already passes because this reader ignores all delivery. For each view and both project names, the exact source-view assertions were observed to throw for a duplicate, a delivered mark on the local context, and release wording replacing branch wording. No genuine suppression regression is falsely claimed against the old reader. |
| workflow/4 | `views.test.ts`, context/define/supersede/retire/decide in empty and booking journals | `context` exits zero and appends a project-owned substitute. The other four verbs exit one for an unknown context, but their messages do not say delivered and read-only. The context write fails byte-preservation too; existing booking records are included in the strengthened cases. |
| workflow/5 | `views.test.ts`, legitimate local supersession | Local append, reason, history and byte preservation pass; the next design omits the delivered context instead of retaining its design and provenance. |
| workflow/6 | `views.test.ts`, context/concept history and decisions | Both histories and context-filtered decisions refuse the delivered name as an unknown bounded context. They must instead return no versions/decisions and expose the current delivered meaning in history's `current`. |
| workflow/7 | `reconstitution.test.ts`, all composed holders and actual fresh-session note | Architect, kino, mav and nico procedures omit reading the delivered workflow. The loaded omp extension's actual fresh-session note also omits it. |
| workflow/8 | `reconstitution.test.ts`, composed holders and post-compaction note | The same composed procedures omit the delivered workflow. After `session_compact`, the actual new session-start note also omits it. |
| workflow/9 | `views.test.ts`, branch transition | Source-owning branch shows its local workflow; switching to the booking-only branch still omits delivery. |
| workflow/10 | `views.test.ts`, first project append | The journal correctly gains only booking, but the subsequent view contains only booking rather than booking beside delivery. |

## Boundaries and isolation

- `fixture.ts` reuses capability-port `host()` and concept-journal git/snapshot/repository helpers. View tests supply a read-only contract-shaped installed document so missing build projection cannot mask reader failures. Installation tests exercise the actual packed release; upgrade and uninstall also use a supplied older installation document as their Given.
- CLI Vitest now creates its own temporary HOME and removes inherited `CRATYLUS_INSTALLATION` before setup and workers start. Its HOME is removed on exit. Tests that deliberately select an installation do so only through their own host environment.
- `packages/runtime/test/delivered-context.test.ts` is classified BEHAVIORAL in canon's gate inventory: it supplies its own journals and negative observations.
- Runtime projection assertions forbid additional top-level or concept fields: historical wording, retired concepts, source decisions, reason/history entries and time-dependent metadata cannot be smuggled into the release. Provenance binds the first context record, not its latest description.
- View checks bind qualification, provenance, read-only marking, source equality, no writes, same-name separation, identity suppression, all five protected append verbs, legitimate local supersession, no fabricated history/decisions, branch changes and first journal creation.
- The actual agent's reading order, recovery of a booking decision and cut, fidelity of its human readback, and independence from remembered conversation remain **judged in use**, not simulated with a model or inferred from instruction text (0154). The deterministic reconstitution checks bind the delivered declarations and the real extension's fresh/post-compaction notes only.

After implementation, rebuild and run the two new-suite commands above. Main owns integration verification; no wider tests, formatter, linter or typecheck was run here.
