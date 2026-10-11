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

## Explicit-package preflight repair

The lead's no-model preflights reported `Unknown agent "builder"` because explicit-only omp loading was given individual installed modules rather than the installation's package root. Subject runners and installed-extension fixture launches now name `.cratylus/omp` explicitly, so omp discovers its agents and skills alongside its declared extensions. Rubric judges retain adapter-only loading and their synthetic host declarations, preserving the existing session-hook isolation assertions. The offline transport control now models omp's package-to-module resolution; no assertions changed.

```sh
EXECUTION_PREFLIGHT=1 pnpm --filter cratylus exec vitest run test/reconstitution/architect test/reconstitution/roles test/reconstitution/overview test/execution-roles -t preflight --reporter verbose
pnpm --filter cratylus exec vitest run test/agent-launch test/runner-extensions.test.ts --reporter verbose
```

Observed: all 18 selected no-model preflights passed (206 unrelated tests skipped). All 29 agent-launch and runner-control checks passed, including installed-only discovery and judge session-hook isolation. No live model runs were taken.

## Decision 0112: earlier seeded answers belong to the host

The captured earlier installation's actual `modelRoles` are now the preservation baseline in every visible earlier-installation upgrade (8, 9, 10 and 20). This includes the binding for `obsolete-agent`: retiring its declaration does not revoke the host's answer. Checks still reject its declaration, skill and every other old projection or reference. Only model-role values are excluded from the old-material text scan; the whole-home ownership check compares retained configuration by parsed content, not YAML/JSON serialization.

```sh
pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'delivery/(8|9|10|20) —' --reporter verbose
env DELIVERY_NEGATIVE=10-bindings pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'delivery/10 —' --reporter verbose
```

Observed against the current pre-0112 build:

| Example     | Observed failing reason                                                                                                                                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delivery/8  | First upgrade deleted `.omp/agent/config.yml`; preservation of the captured seeded answers failed with `ENOENT` at `preserved(h, bindings)`.                                                                                                                                                  |
| delivery/9  | First upgrade deleted that same host-answer file, failing before the subsequent root-edit replacement exercise. Both upgrades now require the answers to remain.                                                                                                                              |
| delivery/10 | The normal case passed: merging the earlier answers with host settings already protects the config in this build. Negative recording removed only `modelRoles.obsolete-agent`; the same preservation assertion failed with expected `obsolete-agent: "@frontier:medium"` missing from actual. |
| delivery/20 | Event-tap migration deleted the earlier host-answer file; `preserved(h, bindings)` failed with `ENOENT`. Removing event-tap material must not remove these answers.                                                                                                                           |

No production code or example text changed. Decision 0112 changes ownership classification, not the removal obligations for projected material.

## Decision 0113: operator choices, host changes, and real version skew

All observations in this section are against **fb0a6d87**, archived into `/tmp/delivery-checks-0113`, installed with `pnpm install --offline`, and built there with `pnpm build`. Only check files were copied into that snapshot. The concurrently changing working tree was never the subject. Every install and omp session uses a temporary HOME; no model turn is made.

`choices.test.ts` binds approved delivery/21–29. Interactive cases drive the existing `runInstall` prompt seam with `interactive: true`, retain each requested model role and display question, and check that display settings have not changed when the question is received. `observe-choice.ts` runs inside real omp: it observes `ctx.model`, lets omp's interactive terminal render, and exits before any provider turn. Supplied tier and persona models were resolved by omp, and the session agent appeared in the terminal. A separate temporary observer proof passed for both hidden and visible status with the same launched persona; the hidden case did not contain the persona name. That proof file was removed after use.

| Example     | Check                                                                                                                                       | Observed red against fb0a6d87                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delivery/3  | Existing host material now includes an explicitly hidden extension-status layout.                                                           | Install changes `showHookStatus: false` to `true`; preservation fails.                                                                                                                                                                                           |
| delivery/6  | Same-version reinstall after a host theme, model binding, and hidden-status change; whole-tree equality.                                    | Reinstall restores visible status and records a host-edit hunk; the tree differs.                                                                                                                                                                                |
| delivery/10 | Upgrade after the host redirects the actual plugin-root link, or replaces that link with a directory.                                       | The redirected link is changed from the host target back to `.cratylus/omp`. The directory replacement already survived; `DELIVERY_NEGATIVE=10-reference` removes its observed `SKILL.md` only, and preservation fails with `undefined` instead of its contents. |
| delivery/13 | Two startups with a genuinely earlier command, alongside the retained label-based forward-skew case.                                        | First startup throws `cratylus: unknown command 'versionSkew'; run cratylus --help` instead of warning about both versions.                                                                                                                                      |
| delivery/14 | Matching recorded version and actual earlier command remain silent and queryable, alongside the label-based matching case.                  | Startup throws the same unknown-command error.                                                                                                                                                                                                                   |
| delivery/15 | Real earlier-command mismatch, then restore the current command, reinstall and query the resolved versions; retained forward-skew case too. | The initial mismatched startup throws that unknown-command error.                                                                                                                                                                                                |
| delivery/21 | All supplied tier/persona/display answers, no questions; actual omp models and rendered agent; no owned settings.                           | Model and rendering observations pass, but `installation.json` records the display answer under `hostEdits`.                                                                                                                                                     |
| delivery/22 | Ask only the missing tier, preserve settled model/display choices, observe omp using the answer.                                            | Normal run passes. The single-fault negative adds a repeat question for the already-bound frontier tier: expected `['model:fast']`, received `['model:fast', 'model:frontier']`.                                                                                 |
| delivery/23 | Interactive consent precedes display change, unrelated layout survives, actual omp displays the agent.                                      | No display question is asked: expected `['agent-status']`, received `[]`.                                                                                                                                                                                        |
| delivery/24 | Both interactive and supplied refusal stay hidden without an incomplete-choice warning.                                                     | Interactive case asks nothing; supplied refusal is ignored and `showHookStatus` becomes true.                                                                                                                                                                    |
| delivery/25 | Four-tier noninteractive partial setup places everything and names only the two missing tiers plus display.                                 | With no display answer and no ability to ask, install enables the display.                                                                                                                                                                                       |
| delivery/26 | Same-version reinstall with original answers after the host changes a model and hides the agent.                                            | Reinstall re-enables status and changes the owned record; whole-tree equality fails.                                                                                                                                                                             |
| delivery/27 | Upgrade keeps both edited and unedited model/display answers while replacing projection.                                                    | The host's hidden display is re-enabled.                                                                                                                                                                                                                         |
| delivery/28 | Uninstall keeps all current model/display settings, not only edited answers.                                                                | Uninstall undoes the original accepted display answer, changing true back to false.                                                                                                                                                                              |
| delivery/29 | Run the actual earlier build to seed tiers and persona roles, verify its ownership record, edit only nico's binding, then upgrade.          | Upgrade removes all unedited seeded bindings and leaves only nico plus the original host roles. It also removes the comma before nico, leaving invalid JSON/YAML; the post-upgrade settings read fails with `YAML Parse error: Unexpected token`.                |

Freeze commands, from the isolated snapshot:

```sh
pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'delivery/(3|6|10|13|14|15) —' --reporter verbose
pnpm --filter cratylus exec vitest run test/delivery/choices.test.ts --reporter verbose
env DELIVERY_CHOICE_NEGATIVE=22 pnpm --filter cratylus exec vitest run test/delivery/choices.test.ts -t 'delivery/22' --reporter verbose
env DELIVERY_NEGATIVE=10-reference pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts -t 'host-replaced' --reporter verbose
pnpm --filter cratylus exec vitest run test/delivery/choices.test.ts -t 'delivery/29' --reporter verbose
```

### Real earlier command

`earlier-build/` preserves the pre-delivery packed packages from `/tmp/capability-pack-gT049G`: cratylus 0.11.0, canon 0.14.0, forge 0.14.5, runtime 0.10.0, schema 0.9.1. These are earlier implementations, not a rewritten version label. The fixture copies a disposable installed dependency tree, replaces all five cratylus package directories whole from those archives, puts that prefix first on PATH, and confirms both `--version` = 0.11.0 and refusal of `versionSkew --explain`. No test depends on the original `/tmp` paths. The current extension remains projected, so the real command boundary is exercised.

Example 29 uses that earlier command to create its own real earlier installation, with host source roles `default`, `smol`, and `alternate` so the old build actually seeds `frontier` and `frontier-other-family`. Its legacy `modelRoleSeeds` record is asserted before upgrade. This covers tier seeds as well as persona bindings; the original captured installation had persona bindings but no source models from which to seed tiers.

SHA-256, in that package order:

```text
c29f4ede82562e8e5719b151b4a31ab54003498f8f2da2f303c88547ed1d8540
8fa03b594e58533ecd8f2fbb413de3211952acee61115fcd5003c8c95717f58a
129db987fccfe12bed4373a98aa7190a14afb015e240ff77f3f77be65e2accaf
e03b9003e1aeb68b24c09b6980666aad8fc3b702a2c6e3416e106234a7b22132
94942ddd0d6fddef1637c2d287a32543f64e17a83c7a972ca9ebcc63123e7872
```

Earlier fixture/setup failures (a skill-specific link assumption where the installation links its whole root, an incomplete builder assignment, a wrongly shaped fixture mark, and npm's empty temporary-HOME cache) were corrected and are not counted as red evidence. No production code or example text changed. The lead owns verification against the completed build.

## Whole-check 5: existing fixtures supply the operator's display choice

The lead's whole-check output `/tmp/wc5-test.log:711–724` records agent-launch judgment case 3 failing without a supplied display answer: its custom layout still has only `model`, no right-hand segments, and `showHookStatus: false`; the unchanged visible-status assertion receives false instead of true. Under 0113 this host is correctly left hidden, not silently modified. That observed failure was not rerun.

The agent-launch fixture now accepts an optional `agentStatus` install answer. Judgment case 3 alone supplies `show`, passed to the actual installed command as `--agent-status show`; its name, mark, and visible-status assertions are unchanged. Other fixture callers supply no new answer. Delivery/4 and /5's prompt stand-ins also implement the new `agentStatus` question, recording any invocation rather than concealing an unexpected question.

At the lead's explicit request, checks on the current tree after this fixture-only change:

```sh
pnpm --filter cratylus typecheck
pnpm --filter cratylus exec vitest run test/agent-launch/judgment-cases.test.ts -t 'judgment case 3' --reporter verbose
```

Observed: typecheck passes; judgment case 3 passes (one test, the two other cases skipped). No production code, example text, or assertion changed.

## Decision 0114: legacy ownership and reference discovery

Subject: **3d5f6f00f76586827e581f05d0e3737f2c4f4d0e**, built once with `pnpm build`.
The ordinary visible suite, without negative-observation switches, produced **16 failed,
56 passed** across delivery structural/choices, delivery-journal structural, and
reconstitution delivery structural checks. Every existing test passed; only the new
0114 checks failed. The build succeeded. Output: `artifact://2831`.

```sh
pnpm --filter cratylus exec vitest run \
  test/delivery/structural.test.ts test/delivery/choices.test.ts \
  test/delivery-journal/structural.test.ts \
  test/reconstitution/delivery/structural.test.ts \
  --no-file-parallelism --reporter verbose
```

| Ruling   | Example     | Check title                                                                              | Observed red on 3d5f6f00                                                                                                                                                                                                                                    |
| -------- | ----------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0114(1a) | delivery/8  | a genuine pre-digest installation leaves no earlier projection and keeps seeded bindings | Upgrade succeeds and seeded bindings survive; the owned-root projection equals a fresh install. `assertOwned` then finds `.agents/purview-guardrail/purview-judge-prompt.md` still present as a projected copy outside the root, with zero root references. |
| 0114(1b) | delivery/8  | no earlier same-name agent outside the root wins harness discovery after upgrade         | Real omp discovery selects `.omp/agent/agents/architect.md`, not `.cratylus/omp/agents/architect.md`. The check compares resolved paths for every installed agent, not names alone. Seeded bindings survive before this assertion too.                      |
| 0114(2)  | delivery/11 | uninstall follows reference targets despite a %s and keeps shared host surfaces          | With the root's record missing or emptied, or the root removed entirely, uninstall reports success but leaves the plugin-root symlink dangling. With a malformed record, uninstall exits 1 on JSON parsing instead of removing the root's references.       |

The unchanged delivery/8 captured-installation test still passes. All other delivery
structural tests, including host changes at reference locations, pass; all ten
delivery/21–29 choice cases pass, including migration of real seeded tier/persona
bindings and an edited binding. Nothing changes production code or example text.

### Real pre-digest provenance

`pre-digest-installation.json` is an actual installation, not today's manifest with
digests deleted. Its source is **4cf7d6db85cb9a06e27031b8e57e87c060dfcab4**, the
parent of **f4f59d80**, which introduced the digest record. The historical build
identifies itself as cratylus **0.5.2**. The source was extracted to a temporary
directory, installed with `pnpm install --offline --ignore-scripts`, and built with
`pnpm build`. The actual command was:

```sh
HOME=<temporary-home> PATH=<historical-build>/node_modules/.bin:$PATH \
  cratylus install --harness omp
```

It ran in an empty temporary project with empty stdin. This historical command has
no `--home`, `--all`, or `--model-roles` options. It installed eight agents and sixteen
skills, including the now-removed `implementer` agent and `carry-on` skill, and seeded
model-role bindings. Its manifest has no `digests` field. All 72 physical files/links
were captured with their modes, using the existing capture fixture's representation;
only the temporary HOME, build prefix, and project prefixes were normalized.
No historical output was edited to manufacture missing digests. The fixture is
self-contained and has no dependency on the capture's temporary directories.

0114(3)'s evidence is in `../delivery-journal/seen-red.md`; 0114(4)'s real-text red
is in `../reconstitution/delivery/EVIDENCE.md`.

### References absent from the root's record

The uninstall fixture also places a relative symlink named `earlier-projection` on
omp's plugin surface and a dependency of that name pointing into the root, neither
listed in the installation record. A fifth case keeps the record intact. This
distinguishes discovery by destination from merely restoring the usual reference
names when a record is missing.

After this strengthening, the targeted command below produced **5 failed, 27 skipped**
on the same build. The four root-damage cases fail for the reasons recorded above.
The intact-record case removes the usual plugin link but leaves
`.omp/plugins/node_modules/earlier-projection -> ../../../.cratylus/omp`; the
no-dangling-reference assertion fails on that relative target. Host plugin references,
the shared manifest's unrelated metadata, and host agent/skill/settings contents
remain explicit preservation obligations in every case.

```sh
pnpm --filter cratylus exec vitest run test/delivery/structural.test.ts \
  -t 'uninstall follows reference targets' --reporter verbose
```
