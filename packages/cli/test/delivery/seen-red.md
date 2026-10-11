# Delivery checks seen red

Frozen before the delivery build. All runs were structural, against packed, installed copies in temporary homes. No model was called and no real HOME was used. Test titles in `structural.test.ts` start with the example reference; the table below identifies each check by that reference and its observed failure.

## Commands

From the repository root:

```sh
pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts --reporter verbose
pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'delivery/(1 |17 |18 )' --reporter verbose
pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'delivery/(6|12|16) —' --reporter verbose
```

For each N in `1 4 5 17 18`, independently:

```sh
env DELIVERY_NEGATIVE=N pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'delivery/N —' --reporter verbose
```

The environment selects a negative **observation**, not a production implementation change. The normal interactive runs for 4 and 5 passed; the corrected installed-runtime checks for 1, 17 and 18 passed. Their negative observations each failed. Initial fixture errors in 17 (assuming a history response shape) and 18 (not converting an extension exception to omp's error result) were corrected; those errors are not counted as evidence. Example 1's initial owned-path precondition was also replaced with actual cross-project harness discovery, so a layout assertion is not counted as proof of user scope.

## Observed failures

| Example     | Check                                                                                                             | Observed failing reason                                                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| delivery/1  | one user installation is offered in existing and later projects, without changing another user                    | Negative observation removes the later project's offered agents. Expected the installed nine-agent corpus; received `[]`. The normal run passed all three real omp discoveries and second-user preservation.                   |
| delivery/2  | every projected leaf belongs to the owned root and outside surfaces are references, never copies                  | `the projection has one owned root`: expected `true`, received `false`; today's install places copies on the old harness surfaces.                                                                                             |
| delivery/3  | colliding host agent, skill, extension and settings survive installation                                          | The host's `architect.md` was overwritten by the corpus's declaration.                                                                                                                                                         |
| delivery/4  | interactive install with all supplied answers asks nothing                                                        | Negative prompt recording asks `models` despite the supplied model answer: expected `[]`, received `['models']`. The unmodified interactive run asked nothing.                                                                 |
| delivery/5  | after an answer interactive install asks only missing information, never the harness or an answered question      | Negative prompt recording asks `practices` twice: four questions but only three distinct unanswered-information categories. The unmodified interactive run passed.                                                             |
| delivery/6  | reinstalling the same version leaves the entire installation and changed host settings unchanged                  | After Mira changes the actual theme setting, same-version install rewrites `config.yml` and adds a host-edit hunk to the deployment manifest. Full before/after equality fails.                                                |
| delivery/7  | the version tool identifies the projecting build and the command reached, not another available build             | `omp registers version_skew`: received `undefined`, with projecting 2.4.0 and another declared 2.6.0 build available.                                                                                                          |
| delivery/8  | a real earlier projection is replaced by exactly the new projection, not merged with removed agents or skills     | `obsolete-agent` / `obsolete-skill` survive in the installation after upgrading the captured corpus variant.                                                                                                                   |
| delivery/9  | upgrade discards all inside-root edits and additions but preserves an outside skill edit                          | The installed skill still contains `Mira changed installed content` after upgrade.                                                                                                                                             |
| delivery/10 | upgrade rewrites every reference while retaining the host references and settings on shared surfaces              | The host replacement of `architect.md` is overwritten during upgrade.                                                                                                                                                          |
| delivery/11 | uninstall removes the whole root and all its references, never customized host surfaces                           | The operator entry point refuses `--home`: `cratylus uninstall: unknown option '--home'`; exit 1 instead of removing that user's installation.                                                                                 |
| delivery/12 | uninstall reaches all projects but neither their records nor a second user installation                           | Same `--home` refusal, after creating real journals and work in three temporary projects and installing separately for the second user.                                                                                        |
| delivery/13 | both starts immediately warn about skew without invoking a tool, changing installation or selecting a build       | First startup produced no warning naming artifacts 2.4.0 and command 2.5.0: expected one warning, received zero.                                                                                                               |
| delivery/14 | matching versions are silent at startup and both remain queryable                                                 | Matching startup was silent, but `version_skew` was not registered, so the versions were unavailable on request.                                                                                                               |
| delivery/15 | reinstalling with the reached command replaces the recorded version and resolves the startup warning              | The initial 2.4.0-artifact / 2.5.0-command startup produced zero skew warnings.                                                                                                                                                |
| delivery/16 | a project-pinned 2.6.0 never redirects either installed 2.4.0 route or causes a warning                           | `version_skew` was not registered. Both installed-command capability invocations are additionally observed by a trace inserted into the installed entry point, without replacing its implementation.                           |
| delivery/17 | command and tool share journal writes and supersession through the installed runtime with no source path          | Negative tool observation returns `{}` instead of the command-written design; assertion cannot find `A two-hour interval.`. The normal run completed command→tool read, tool supersession→command read, and equal final views. |
| delivery/18 | command and tool report the same missing-decision refusal without changing the journal                            | Negative observation substitutes success for the tool's refusal: `isError` is false rather than true. The normal run gave the same missing-decision reason through both routes and left the journal unchanged.                 |
| delivery/19 | the event tap is absent from delivered commands, projection and harness tools, including hidden or disabled forms | Installed command help still advertises the `eventTap` capability.                                                                                                                                                             |
| delivery/20 | upgrading a real event-tap installation removes its material and references but keeps unrelated extensions        | After upgrading the captured event-tap installation, installed command help still advertises `eventTap`.                                                                                                                       |

The warning assertions run before any tool call. Version fixtures change the installed `cratylus/package.json` declaration and confirm `--version`; no fake version-returning command is substituted. Extension loading reuses the binding fixture's omp mocks, resetting the module cache for each newly modeled omp process. Same-session calls keep the same loaded extension. Interactive checks run the actual install engine with `interactive: true` and its existing prompt seam, retaining every requested question.

## Earlier installation provenance

`earlier-installation.json` was captured before the build from packed cratylus 0.11.0 and its packed dependencies using the existing global setup. `capture-earlier.ts` documents and reproduces that capture from an **earlier installed prefix**, never from the version under judgment. The earlier corpus adds `obsolete-agent` and `obsolete-skill` through a real consumer corpus variant. The captured installation includes the event-tap skill and script, the real legacy deployment manifest and host-edit records, all projected declarations and adapters, and executable file modes. Temporary home/prefix/project paths are normalized and expanded on restore. Examples 8, 9, 10 and 20 restore this installation rather than inventing an unowned stale file and calling it an earlier install. The version-skew upgrades use real installations by the packed command with different declared package versions.

## Earlier files re-pointed (location only)

- `packages/cli/test/agent-launch/fixture.ts`
- `packages/cli/test/agent-launch/structural.test.ts`
- `packages/cli/test/capability-port/fixture.ts`
- `packages/cli/test/capability-port/structural.test.ts`
- `packages/cli/test/catalog-recut/fixture.ts`
- `packages/cli/test/execution-roles/runner.ts`
- `packages/cli/test/reconstitution/architect/runner.ts`
- `packages/cli/test/reconstitution/binding/fixture.ts`
- `packages/cli/test/reconstitution/binding/structural.test.ts`
- `packages/cli/test/reconstitution/delivery/structural.test.ts`
- `packages/cli/test/reconstitution/overview/rubric-runner.ts`
- `packages/cli/test/reconstitution/roles/runner.ts`
- `packages/cli/test/runner-extensions.test.ts`

Installed agents, skills and adapters now use `.cratylus/omp/{agents,skills,extensions}`. Host-owned synthetic declarations, model settings, credential stores, observer extensions and project-local declarations intentionally retain their harness locations. The consumer `film-agent` and synthetic `rubric-judge` readers distinguish those host declarations from installed corpus declarations. Existing capability-inventory equality is unchanged: the lead settled version skew as a runtime-explained capability, so its thin adapter remains covered by that equality.

Only these delivery checks were run; earlier suites are left for the lead's whole check after the build.

## Whole-check harness repair

The lead's first whole check found three plumbing faults, not changes to example meaning:

- The real-omp discovery observer lacked ambient declarations in the CLI's TypeScript environment. `delivery/omp.d.ts` now describes only the read-only host APIs the observer consumes, following the existing agent-launch observer convention.
- The capability-port fixture enumerated only owned-root modules, excluding its own host-placed witness and registration controls. Its module inventory now includes both the owned-root projection and the host extension surface; provenance assertions remain unchanged.
- The replacement-package fixture bumped the runtime but left forge pinning the previous version, allowing npm to install a registry runtime below forge. It now packs a dependency-consistent runtime, forge and command together. Its post-install assertions require exactly one runtime in the lockfile, version `999.0.0-cut6`, resolved from a local packed file rather than the registry.

After those repairs, the lead-requested commands ran on the current tree:

```sh
pnpm --filter cratylus typecheck
pnpm --filter cratylus exec vitest run test/capability-port test/delivery --reporter verbose
```

Observed: CLI typecheck passed; 6 test files passed and 1 was skipped, with 102 tests passed and 4 skipped. The substring filter also selected `test/delivery-journal`; all selected tests passed. Every visible delivery example passed, as did the package replacement, host-witness and registration controls. No live model run was taken.
