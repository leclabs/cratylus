# plan-cutover

**Wave 4 (terminal).** Realizes `plan` — the clean cutover of the stored plan layout (§ Boundaries).

## Intent

"The plan-state folders, the plan markers and the plan-set tooling the `plan` capability replaces
are deleted, together with the plan skill's `mirror` law, the runtime `carryOn` capability that
reads them, and memory's handling of plan paths. The existing plans under `plans/` are stale and are
removed, not migrated." Every caller is migrated; nothing is captured as notes.

1. **The layout and its tooling.** Delete `packages/canon/src/plan-states.ts`,
   `packages/canon/tooling/plan-set.ts`, `plan-set-cli.ts`, `plan-set/plan-set.sh`,
   `packages/canon/test/plan-set.test.ts`; the `plan-set` and `plan` scripts of
   `packages/canon/package.json` and the root `plan` script.
2. **`plans/` entirely.** `plans/omp-harness/**` (with `.bound` and `.ruling-owed`), the two loose
   plan-mode files at `plans/`'s root, and this plan, `plans/record-store/**` — removed, not moved,
   not migrated (`PLAN.md` N5). This unit is accepted on its commit.
3. **The runtime `carryOn` capability.** Its capability directory, port, test, keyspace and
   `CapabilityPort` members, `RuntimePlugin` field, `main.ts` route, barrel export, README rows,
   canon's `RUNTIME_CAPABILITIES` member, and the comments naming its gate.
4. **Memory's handling of plan paths.** The `plan-path` class of `audit.ts`, `PLAN.md` among
   `node.ts`'s `DEFAULT_MARKERS`, the prose naming them (`audit.ts`, `node.ts`, `cli.ts` help,
   `seeds.ts`, `runtime/src/ports/memory.ts`), and the tests built on them: the `plan-path` legs of
   `audit.test.ts`, the `PLAN.md` precedence leg of `node.test.ts`, and
   `session-isolation-integration.test.ts`, whose whole scenario is the retired state folders and
   `.owner` (delete it, or rebuild its session-isolation claim on a scenario that names no plan).
   `cli.test.ts`'s `plan:demo/x` is an inert scope tag and stays.
5. **Gates whose subject was the layout.** `command-veracity.test.ts` loses its PLAN-PATH and
   DESIGNATOR legs, its `plan-set` import and its `plans/**` carve-outs, and gains an exemption for
   the records root: records are immutable history, so a gate over their text could only be
   satisfied by never recording (the reason `plans/*/completed/**` was exempt).
   `signify-marker-class.test.ts`'s sanctioned home for recorded debt moves from `plans/` to the
   notebook's records. `reader-register.ts` and `reader-reach.test.ts` retire the `task-file` and
   `plan-mirror` artifact classes and their fixtures. `gate-convicts.test.ts` unregisters every
   deleted test file and drops the orphan comment beside the `capability-keyspace` row that
   describes a deleted carry-on cell test.
6. **Live claims about the layout.** The `turbo.json` test comment, the `plans/` symlink notes in
   `.husky/pre-commit` and `.prettierignore`, the `gates.yml` `fetch-depth` rationale (the
   designator oracle is gone; the immutability gate's range diff is what needs history now), the
   header of `docs/research/cold-decode-as-a-skill.md`, the task-file path cited in
   `fixtures/generated/delegation-prompt.md`, and the claims that `deploy` writes
   `<target>/plans/founding/` at `command-veracity.test.ts:108,427,772` (measured after
   `scaffold-cutover` landed; false since it did). The consumer claim at `plan-states.ts:2-4` — that
   the canon project template sources its `planStates` there — went false with `scaffold-cutover`
   too, and dies with the file. Measured-incident comments recording a past defect in
   `plan-set.ts` (`positional-path.test.ts`, `packages/tooling/src/repo-root.ts`,
   `symbol-altitude.test.ts`) are history, not claims, and stay unless one reads as present tense.

## Static

- `git show 0c9da09c:docs/design/record-store.md` § Boundaries.
- `PLAN.md` § Census — the measured reference sets and their commands; re-run them at dispatch.
- `.github/workflows/gates.yml`, `turbo.json`, `.husky/pre-commit`, `.prettierignore`.
- `packages/canon/test/{command-veracity,gate-convicts,reader-reach}.test.ts`,
  `packages/canon/test/reader-register.ts`, `packages/forge/test/catalog/signify-marker-class.test.ts`.

## Deps

`note-skill`, `trio-skill-routing` (the `plan` skill no longer imports `plan-states.ts`; its
`mirror` law is gone), `design-migration`, `scaffold-cutover` (the scaffold no longer imports it) —
and through them every other unit: this one deletes the plan's own files, so it runs last.

## Outputs

- Deleted: `packages/canon/src/plan-states.ts`, `packages/canon/tooling/plan-set.ts`,
  `packages/canon/tooling/plan-set-cli.ts`, `packages/canon/tooling/plan-set/**`,
  `packages/canon/test/plan-set.test.ts`,
  `packages/canon/test/fixtures/generated/{plan-mirror,task-file,task-file-dep}.md`,
  `packages/runtime/src/capabilities/carry-on/**`, `packages/runtime/src/ports/carry-on.ts`,
  `packages/runtime/test/carry-on.test.ts`, `plans/**`
- Edited, canon: `packages/canon/src/manifest.ts`, `packages/canon/package.json`,
  `packages/canon/src/dimensions/autonomy/human-on-the-loop.ts` (its comment names the gate),
  `packages/canon/test/{command-veracity,gate-convicts,reader-reach,capability-keyspace,bin-name-single-home,runtime-shim}.test.ts`,
  `packages/canon/test/reader-register.ts`, `packages/canon/test/fixtures/generated/delegation-prompt.md`;
  permitted only where a line reads as a live claim: `packages/canon/test/positional-path.test.ts`,
  `packages/canon/test/symbol-altitude.test.ts`, `packages/tooling/src/repo-root.ts`
- Edited, runtime: `packages/runtime/src/{loader,plugin,main,index,bin-name}.ts`,
  `packages/runtime/src/ports/memory.ts`, `packages/runtime/README.md`
- Edited, memory: `packages/memory/src/{audit,node,cli,seeds}.ts`,
  `packages/memory/test/{audit,node}.test.ts`,
  `packages/memory/test/session-isolation-integration.test.ts` (deleted or rebuilt)
- Edited, forge and cli: `packages/forge/test/catalog/signify-marker-class.test.ts`,
  `packages/cli/README.md`
- Edited, root: `package.json`, `turbo.json`, `.husky/pre-commit`, `.prettierignore`,
  `.github/workflows/gates.yml`, `docs/research/cold-decode-as-a-skill.md`
- `.changeset/plan-cutover.md`

## Accept

1. `git ls-files plans` prints nothing (at `c501e002`: 14 files besides this plan's own).
2. `git grep -nE "PLAN_STATES|PLAN_FRONTIER|PLAN_MARKERS|SUPERSEDED_MARKER|from '[^']*(plan-set|plan-states)[^']*'|tooling/plan-set" -- . ':!*CHANGELOG.md' ':!<records root>'`
   prints nothing; the same command with `-c`, run at `c501e002`, printed a non-zero total (print
   both). And `git grep -n "plan-states" -- packages/canon/tooling` prints nothing — moved here from
   `scaffold-cutover`, since it holds only once `plan-set.ts` (which hit at lines 2 and 44 when
   `scaffold-cutover` landed) is deleted.
3. The stale claims named in Intent step 6 are gone, each checked by itself:
   (a) `git ls-files packages/canon/src/plan-states.ts` prints nothing, which removes the consumer
   claim at its lines 2–4 (the canon project template no longer sources `planStates` there);
   (b) `git grep -n "plans/founding" -- packages/canon/test/command-veracity.test.ts` prints nothing
   (when `scaffold-cutover` landed it hit lines 108, 427 and 772), and
   `git grep -n "plans/founding" -- packages` prints nothing.
4. `carryOn` is gone: `git ls-files packages/runtime/src/capabilities/carry-on packages/runtime/src/ports/carry-on.ts`
   prints nothing; `git grep -n "carryOn" -- packages/runtime/src packages/canon/src/manifest.ts packages/cli`
   prints nothing (at `c501e002`: the capability, the manifest member, the CLI README); and
   `git grep -nE "PlanLayout|--plan-root|--states" -- packages` prints nothing. The `carry-on`
   skill's `carryOn` binding and its history comment are the cell, not the capability, and stay.
5. Memory's plan-path handling is gone:
   `git grep -nE "plan-path|'PLAN\.md'|PLAN\.md" -- packages/memory/src packages/runtime/src/ports/memory.ts`
   prints nothing (at `c501e002`: `audit.ts`, `node.ts`, `cli.ts`, `ports/memory.ts`).
6. `pnpm --filter @cratylus/canon test -- capability-keyspace gate-convicts command-veracity reader-reach`,
   `pnpm --filter @cratylus/memory test` and `pnpm --filter @cratylus/forge test -- signify-marker-class`
   pass.
7. Sole: plan state has one home, the plan domain — criteria 1–5 together are its check.
8. `pnpm verify` passes.
9. `.changeset/plan-cutover.md` names every package this unit's paths changed.
